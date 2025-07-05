"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.indexRouter = void 0;
const express_1 = __importDefault(require("express"));
const webscraping_1 = require("./webscraping/webscraping");
const indexRouter = express_1.default.Router();
exports.indexRouter = indexRouter;
indexRouter.use(webscraping_1.webscrapingRoute);
