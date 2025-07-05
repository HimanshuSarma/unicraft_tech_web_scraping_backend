"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.initializeBrowser = initializeBrowser;
exports.closeBrowser = closeBrowser;
exports.scrapeSearch = scrapeSearch;
exports.parseDocumentFromLink = parseDocumentFromLink;
exports.scrapeTitle = scrapeTitle;
const puppeteer_extra_1 = __importDefault(require("puppeteer-extra"));
const puppeteer_extra_plugin_stealth_1 = __importDefault(require("puppeteer-extra-plugin-stealth"));
const transformers_1 = require("@xenova/transformers");
const parseCompaniesFromText_1 = require("./parseCompaniesFromText");
puppeteer_extra_1.default.use((0, puppeteer_extra_plugin_stealth_1.default)());
let browserInstance = null;
let nerModel = null;
async function loadNERModel() {
    if (!nerModel) {
        nerModel = await (0, transformers_1.pipeline)('ner', 'Xenova/bert-base-NER');
    }
}
function cleanText(rawText) {
    return rawText
        .replace(/\s+/g, ' ') // Normalize whitespace
        .replace(/[^a-zA-Z0-9 .,@'-]/g, '') // Strip non-standard chars except useful symbols
        .trim();
}
async function randomDelay(minMs, maxMs) {
    const delay = Math.random() * (maxMs - minMs) + minMs;
    await new Promise(resolve => setTimeout(resolve, delay));
}
async function initializeBrowser() {
    if (!browserInstance) {
        console.log('Launching Puppeteer browser...');
        browserInstance = await puppeteer_extra_1.default.launch({
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
async function closeBrowser() {
    if (browserInstance) {
        console.log('Closing Puppeteer browser...');
        await browserInstance.close();
        browserInstance = null;
        console.log('Puppeteer browser closed.');
    }
}
async function preparePageForScraping(page) {
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36');
    await page.setViewport({ width: 1366, height: 768 });
    await page.setExtraHTTPHeaders({
        'accept-language': 'en-US,en;q=0.9',
    });
    await page.mouse.move(100, 100);
    await randomDelay(200, 500);
}
async function scrapeTitle(url) {
    if (!browserInstance)
        return { url, title: null, error: 'Browser not initialized.' };
    let page = null;
    try {
        page = await browserInstance.newPage();
        await preparePageForScraping(page);
        await randomDelay(200, 700);
        await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });
        const title = await page.title();
        return { url, title };
    }
    catch (error) {
        return { url, title: null, error: error.message };
    }
    finally {
        if (page)
            await page.close();
    }
}
async function scrapeSearch(query) {
    if (!browserInstance)
        return { query, results: [], error: 'Browser not initialized.' };
    let page = null;
    try {
        let searchResults = [];
        if (typeof query === "string") {
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
            searchResults = await page.evaluate(() => {
                const results = [];
                const items = document.querySelectorAll('.result');
                items.forEach(item => {
                    const titleElement = item.querySelector('.result__a');
                    const snippetElement = item.querySelector('.result__snippet');
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
        }
        else {
            searchResults = query?.map?.(url => {
                return {
                    title: "",
                    link: url,
                    snippet: null
                };
            });
        }
        console.log(searchResults, `searchResults`);
        const firstFewResults = searchResults.slice(0, 4);
        const results = [];
        try {
            for (const result of firstFewResults) {
                const companyInfo = await parseDocumentFromLink(result.link);
                results.push(companyInfo);
            }
        }
        catch (err) {
            console.log(`loop error`, err);
        }
        return { query, results };
    }
    catch (error) {
        return { query, results: [], error: error.message };
    }
    finally {
        if (page)
            await page.close();
    }
}
async function parseDocumentFromLink(url) {
    console.log(`parseDocumentFromLink`, url);
    if (!browserInstance)
        throw new Error("Browser not initialized.");
    const page = await browserInstance.newPage();
    await preparePageForScraping(page);
    try {
        const finalUrl = new URL(url);
        const directUrl = finalUrl.searchParams.get('uddg');
        const targetUrl = directUrl ? decodeURIComponent(directUrl) : url;
        await page.goto(targetUrl, { waitUntil: 'networkidle2', timeout: 30000 });
        const pageText = await page.evaluate(() => document.body.innerText);
        const cleanedText = cleanText(pageText);
        return (0, parseCompaniesFromText_1.extractEntitiesFromText)(cleanedText);
    }
    catch (err) {
        return { url, error: err.message };
    }
    finally {
        await page.close();
    }
}
