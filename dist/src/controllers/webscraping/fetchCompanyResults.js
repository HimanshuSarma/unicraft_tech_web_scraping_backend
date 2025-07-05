"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.fetchCompanyResultsController = void 0;
exports.initializeBrowser = initializeBrowser;
exports.closeBrowser = closeBrowser;
const zod_1 = require("zod"); // Import Zod
const puppeteer_1 = __importDefault(require("puppeteer"));
const scraper_1 = require("../../services/webscraper/scraper");
// Global browser instance to reuse for performance.
// Initialize it when the server starts.
let browserInstance = null;
/**
 * Initializes the Puppeteer browser instance.
 * Call this once when your Express app starts.
 */
async function initializeBrowser() {
    if (!browserInstance) {
        console.log('Launching Puppeteer browser...');
        browserInstance = await puppeteer_1.default.launch({
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
async function closeBrowser() {
    if (browserInstance) {
        console.log('Closing Puppeteer browser...');
        await browserInstance.close();
        browserInstance = null;
        console.log('Puppeteer browser closed.');
    }
}
const urlSchema = zod_1.z.string().url('Invalid URL format').startsWith('https://', 'URL must start with https://');
const urlsBodySchema = zod_1.z.object({
    urls: zod_1.z.union([
        urlSchema, // Single URL string
        zod_1.z.array(urlSchema).min(1) // Array of URL strings
    ])
});
const fetchCompanyResultsController = {
    validation: (async (req, res, next) => {
        try {
            urlsBodySchema.parse(req.body);
            next();
        }
        catch (err) {
            if (err instanceof zod_1.z.ZodError) {
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
    }),
    controller: (async (req, res, next) => {
        try {
            const urlsInput = req?.body?.urls; // Renamed to urlsInput to avoid confusion
            console.log(urlsInput, `urlsInput`);
            let scrapedResults = [];
            // Determine if it's a single string (URL or Query) or an array of URLs
            if (typeof urlsInput === 'string') {
                // If it's a string, check if it's a URL or a search query
                if (urlsInput.startsWith('http://') || urlsInput.startsWith('https://')) {
                    // It's a single URL
                    const result = await (0, scraper_1.scrapeTitle)(urlsInput);
                    scrapedResults.push(result);
                }
                else {
                    // It's a search query
                    const result = await (0, scraper_1.scrapeSearch)(urlsInput);
                    scrapedResults.push(result);
                }
            }
            else if (Array.isArray(urlsInput)) {
                // If it's an array, process each as a URL (as per schema validation)
                const result = await (0, scraper_1.scrapeSearch)(urlsInput);
                scrapedResults.push(result);
            }
            return res.status(200).json({ success: true, data: scrapedResults });
        }
        catch (err) {
            return res.status(500).json({ success: false, message: err?.message || 'Internal server error' });
        }
    })
};
exports.fetchCompanyResultsController = fetchCompanyResultsController;
