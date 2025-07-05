import express from "express";
import { fetchCompanyResultsController } from "../../controllers/webscraping/fetchCompanyResults";
import { IFetchCompanyResultsRequestBody } from "../../types/requestTypes";
import { isRateLimited } from "../../middlewares/rateLimiting/limitPerIP";

const webscrapingRoute = express.Router();

webscrapingRoute.post<
  any,
  any,
  IFetchCompanyResultsRequestBody
>(
  `/getCompanyDetails`,
  isRateLimited,
  fetchCompanyResultsController.validation,
  fetchCompanyResultsController.controller
)

export {
  webscrapingRoute
};