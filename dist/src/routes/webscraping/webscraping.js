"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.webscrapingRoute = void 0;
const express_1 = __importDefault(require("express"));
const fetchCompanyResults_1 = require("../../controllers/webscraping/fetchCompanyResults");
const webscrapingRoute = express_1.default.Router();
exports.webscrapingRoute = webscrapingRoute;
webscrapingRoute.post(`/getCompanyDetails`, fetchCompanyResults_1.fetchCompanyResultsController.controller);
