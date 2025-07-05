import { Request, Response, NextFunction, RequestHandler } from 'express';
import { z } from 'zod'; // Import Zod
import puppeteer, { Browser, Page } from 'puppeteer';
import { IFetchCompanyResultsRequestBody } from '../../types/requestTypes';
import { scrapeSearch, scrapeTitle } from '../../services/webscraper/scraper';

// Interface for the data we'll scrape (just title for this example)
interface ScrapedData {
  url: string;
  title: string | null;
  error?: string;
}

// Define the SearchResult interface (from your scraper.ts)
interface SearchResult {
  query: string;
  results: Array<{ title: string | null; link: string | null; snippet: string | null }>;
  error?: string;
}

// Global browser instance to reuse for performance.
// Initialize it when the server starts.
let browserInstance: Browser | null = null;

/**
 * Initializes the Puppeteer browser instance.
 * Call this once when your Express app starts.
 */
export async function initializeBrowser(): Promise<void> {
  if (!browserInstance) {
    console.log('Launching Puppeteer browser...');
    browserInstance = await puppeteer.launch({
      headless: true, // Use 'new' for new headless, true for old headless
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    console.log('Puppeteer browser launched.');
  }
}

/**
 * Closes the Puppeteer browser instance.
 * Call this when your Express app shuts down.
 */
export async function closeBrowser(): Promise<void> {
  if (browserInstance) {
    console.log('Closing Puppeteer browser...');
    await browserInstance.close();
    browserInstance = null;
    console.log('Puppeteer browser closed.');
  }
}

/**
 * Scrapes titles from a single URL or an array of URLs.
 * @param urls A single URL string or an array of URL strings.
 * @returns A promise that resolves to an array of ScrapedData.
 */
// export async function scrapeTitles(urls: string | string[]): Promise<ScrapedData[]> {
//   const urlsToScrape = Array.isArray(urls) ? urls : [urls];
//   const results: ScrapedData[] = [];

//   // Process URLs sequentially to avoid overwhelming the server/website
//   for (const url of urlsToScrape) {
//     if (!url.startsWith('http://') && !url.startsWith('https://')) {
//       results.push({ url, title: null, error: 'Invalid URL format. Must start with http:// or https://' });
//       continue;
//     }
//     const result = await scrapeTitle(url);
//     results.push(result);
//   }

//   return results;
// }

const urlSchema = z.string().url('Invalid URL format').startsWith('https://', 'URL must start with https://');

const urlsBodySchema = z.object({
  urls: z.union([
    urlSchema, // Single URL string
    z.array(urlSchema) // Array of URL strings
  ])
});

const fetchCompanyResultsController = {
  validation: (async (
    req: Request<any, any, IFetchCompanyResultsRequestBody>,
    res: Response,
    next: NextFunction
  ) => {
    try {
      urlsBodySchema.parse(req.body);
    } catch (err: any) {
      if (err instanceof z.ZodError) {
        // Zod validation error
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: err.errors.map(e => ({ path: e.path.join('.'), message: e.message }))
        });
      }
      // Other unexpected errors
      console.error("Unexpected error during validation:", err);
      return res.status(500).json({ success: false, message: 'Internal server error during validation.' });
    }
  }) as RequestHandler<any, any, IFetchCompanyResultsRequestBody>,
  controller: (async (
    req: Request<any, any, IFetchCompanyResultsRequestBody>,
    res: Response,
    next: NextFunction
  ): Promise<any> => {
    try {
      const urlsInput = req?.body?.urls; // Renamed to urlsInput to avoid confusion

      let scrapedResults: (ScrapedData | SearchResult)[] = [];

      // Determine if it's a single string (URL or Query) or an array of URLs
      if (typeof urlsInput === 'string') {
        // If it's a string, check if it's a URL or a search query
        if (urlsInput.startsWith('http://') || urlsInput.startsWith('https://')) {
          // It's a single URL
          const result = await scrapeTitle(urlsInput);
          scrapedResults.push(result);
        } else {
          // It's a search query
          const result = await scrapeSearch(urlsInput);
          scrapedResults.push(result);
        }
      } else if (Array.isArray(urlsInput)) {
        // If it's an array, process each as a URL (as per schema validation)
        for (const url of urlsInput) {
          const result = await scrapeTitle(url);
          scrapedResults.push(result);
        }
      }

      return res.status(200).json({ success: true, data: scrapedResults });
    } catch (err: any) {
      return res.status(500).json({ success: false, message: err?.message || 'Internal server error' });
    }
  }) as RequestHandler<any, any, IFetchCompanyResultsRequestBody>
};

export {
  fetchCompanyResultsController
};