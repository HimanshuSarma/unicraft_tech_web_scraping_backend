"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const routes_1 = require("./routes");
const scraper_1 = require("./services/webscraper/scraper");
const app = (0, express_1.default)();
const PORT = 8000;
app.use((0, cors_1.default)({
    origin: "*"
}));
app.use(express_1.default.json());
app.use(routes_1.indexRouter);
app.listen(PORT, async () => {
    console.log(`Server listening on ${PORT}`);
    await (0, scraper_1.initializeBrowser)(); // <-- initializeBrowser() is called right here! 
});
