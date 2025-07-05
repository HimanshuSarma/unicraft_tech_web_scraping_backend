import express from "express";
import { fetchCompanyResultsController } from "../../controllers/webscraping/fetchCompanyResults";
import { IFetchCompanyResultsRequestBody } from "../../types/requestTypes";

const webscrapingRoute = express.Router();

webscrapingRoute.post<
  any,
  any,
  IFetchCompanyResultsRequestBody
>(
  `/getCompanyDetails`,
  fetchCompanyResultsController.controller
)

export {
  webscrapingRoute
};