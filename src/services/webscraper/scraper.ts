import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import { Browser, Page } from 'puppeteer';
import { cat, pipeline } from '@xenova/transformers';
import { extractEntitiesFromText } from './parseCompaniesFromText';

puppeteer.use(StealthPlugin());

interface ScrapedData {
  url: string;
  title: string | null;
  error?: string;
}

interface SearchResult {
  query: string;
  results: Array<any>;
  error?: string;
}

let browserInstance: Browser | null = null;
let nerModel: any = null;

async function loadNERModel() {
  if (!nerModel) {
    nerModel = await pipeline('ner', 'Xenova/bert-base-NER');
  }
}

function cleanText(rawText: string): string {
  return rawText
    .replace(/\s+/g, ' ')           // Normalize whitespace
    .replace(/[^a-zA-Z0-9 .,@'-]/g, '') // Strip non-standard chars except useful symbols
    .trim();
}

async function randomDelay(minMs: number, maxMs: number): Promise<void> {
  const delay = Math.random() * (maxMs - minMs) + minMs;
  await new Promise(resolve => setTimeout(resolve, delay));
}

export async function initializeBrowser(): Promise<void> {
  if (!browserInstance) {
    console.log('Launching Puppeteer browser...');
    browserInstance = await puppeteer.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-blink-features=AutomationControlled',
        '--disable-features=IsolateOrigins,site-per-process',
        '--incognito'
      ]
    });
    console.log('Puppeteer browser launched.');
  }
}

export async function closeBrowser(): Promise<void> {
  if (browserInstance) {
    console.log('Closing Puppeteer browser...');
    await browserInstance.close();
    browserInstance = null;
    console.log('Puppeteer browser closed.');
  }
}

async function preparePageForScraping(page: Page): Promise<void> {
  await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36');
  await page.setViewport({ width: 1366, height: 768 });
  await page.setExtraHTTPHeaders({
    'accept-language': 'en-US,en;q=0.9',
  });
  await page.mouse.move(100, 100);
  await randomDelay(200, 500);
}

async function scrapeTitle(url: string): Promise<ScrapedData> {
  if (!browserInstance) return { url, title: null, error: 'Browser not initialized.' };

  let page: Page | null = null;
  try {
    page = await browserInstance.newPage();
    await preparePageForScraping(page);
    await randomDelay(200, 700);
    await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });
    const title = await page.title();
    return { url, title };
  } catch (error: any) {
    return { url, title: null, error: error.message };
  } finally {
    if (page) await page.close();
  }
}

export async function scrapeSearch(query: string): Promise<SearchResult> {
  if (!browserInstance) return { query, results: [], error: 'Browser not initialized.' };

  let page: Page | null = null;
  try {
    page = await browserInstance.newPage();
    await preparePageForScraping(page);

    const encodedQuery = encodeURIComponent(query);
    const searchUrl = `https://html.duckduckgo.com/html/?q=${encodedQuery}`;
    console.log(`Searching for: ${query} (${searchUrl})`);

    const response = await page.goto(searchUrl, { waitUntil: 'networkidle2', timeout: 45000 });

    const isCaptchaPage = await page.evaluate(() => {
      const captchaForm = document.querySelector('#captcha-form');
      const blockingMessage = document.body.textContent?.includes('Our systems have detected unusual traffic');
      const consentButton = document.querySelector('form[action*="/consent"] button');
      return captchaForm !== null || blockingMessage || consentButton !== null;
    });

    if (isCaptchaPage) {
      return {
        query,
        results: [],
        error: 'Blocked by CAPTCHA or consent page.'
      };
    }

    await page.waitForSelector('.result', { timeout: 10000 });

    const searchResults = await page.evaluate(() => {
      const results: { title: string; link: string; snippet: string | null }[] = [];
      const items = document.querySelectorAll('.result');
      items.forEach(item => {
        const titleElement = item.querySelector('.result__a') as HTMLAnchorElement | null;
        const snippetElement = item.querySelector('.result__snippet') as HTMLElement | null;
        if (titleElement?.textContent && titleElement.href) {
          results.push({
            title: titleElement.textContent.trim(),
            link: titleElement.href,
            snippet: snippetElement?.textContent?.trim() || null
          });
        }
      });
      return results;
    });

    const firstFewResults = searchResults.slice(1, 4);
    const results: Array<any> = [];
    try {
      for (const result of firstFewResults) {
        const companyInfo = await parseDocumentFromLink(result.link);
        results.push(companyInfo);
      }
    } catch (err) {
      console.log(`loop error`, err);
    }

    return { query, results };
  } catch (error: any) {
    return { query, results: [], error: error.message };
  } finally {
    if (page) await page.close();
  }
}

export async function parseDocumentFromLink(url: string): Promise<any> {

  if (!browserInstance) throw new Error("Browser not initialized.");
  const page = await browserInstance.newPage();
  await preparePageForScraping(page);

  try {
    const finalUrl = new URL(url);
    const directUrl = finalUrl.searchParams.get('uddg');
    const targetUrl = directUrl ? decodeURIComponent(directUrl) : url;

    await page.goto(targetUrl, { waitUntil: 'networkidle2', timeout: 30000 });

    const pageText = await page.evaluate(() => document.body.innerText);
    const cleanedText = cleanText(pageText);

    return extractEntitiesFromText(cleanedText);
 
    // const aiCompanyNames = await extractEntitiesFromText(
    //   cleanedText
    // );
    
    // const aiEmails = pageText.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-z]{2,}/g) || [];
    // const aiPhones = pageText.match(/(\+?\d{1,3})?[\s.-]?\(?\d{2,4}\)?[\s.-]?\d{3,4}[\s.-]?\d{3,4}/g) || [];

    // // console.log(aiCompanyNames, pageText, `aiCompanyNames`)

    // const companyDetails = await page.evaluate(() => {
    //   const getEmails = () => {
    //     const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-z]{2,}/g;
    //     return Array.from(document.body.innerText.matchAll(emailRegex)).map(m => m[0]);
    //   };

    //   const getPhones = () => {
    //     const phoneRegex = /(\+?\d{1,3})?[\s.-]?\(?\d{2,4}\)?[\s.-]?\d{3,4}[\s.-]?\d{3,4}/g;
    //     return Array.from(document.body.innerText.matchAll(phoneRegex)).map(m => m[0]);
    //   };

    //   const getLinks = () => {
    //     return Array.from(document.querySelectorAll('a'))
    //       .filter(link => {
    //         const text = link.textContent?.toLowerCase() || '';
    //         return text.includes('contact') || text.includes('about') || text.includes('team');
    //       })
    //       .map(link => ({ text: link.textContent?.trim(), href: link.href }));
    //   };

    //   return {
    //     emails: getEmails(),
    //     phones: getPhones(),
    //     contactLinks: getLinks(),
    //     pageTitle: document.title,
    //   };
    // });

    // return {
    //   url: targetUrl,
    //   companyNames: aiCompanyNames,
    //   emails: [...new Set([...companyDetails.emails, ...aiEmails])],
    //   phones: [...new Set([...companyDetails.phones, ...aiPhones])],
    //   contactLinks: companyDetails.contactLinks,
    //   pageTitle: companyDetails.pageTitle
    // };
  } catch (err: any) {
    return { url, error: err.message };
  } finally {
    await page.close();
  }
}

export { scrapeTitle };
