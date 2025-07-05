import { RequestHandler } from 'express';
import { IFetchCompanyResultsRequestBody } from '../../types/requestTypes';
/**
 * Initializes the Puppeteer browser instance.
 * Call this once when your Express app starts.
 */
export declare function initializeBrowser(): Promise<void>;
/**
 * Closes the Puppeteer browser instance.
 * Call this when your Express app shuts down.
 */
export declare function closeBrowser(): Promise<void>;
declare const fetchCompanyResultsController: {
    validation: RequestHandler<any, any, IFetchCompanyResultsRequestBody>;
    controller: RequestHandler<any, any, IFetchCompanyResultsRequestBody>;
};
export { fetchCompanyResultsController };
