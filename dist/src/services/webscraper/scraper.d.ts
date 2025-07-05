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
export declare function initializeBrowser(): Promise<void>;
export declare function closeBrowser(): Promise<void>;
declare function scrapeTitle(url: string): Promise<ScrapedData>;
export declare function scrapeSearch(query: string): Promise<SearchResult>;
export declare function parseDocumentFromLink(url: string): Promise<any>;
export { scrapeTitle };
