import express from "express";
import { webscrapingRoute } from "./webscraping/webscraping";

const indexRouter = express.Router();

indexRouter.use(webscrapingRoute);

export {
  indexRouter
};