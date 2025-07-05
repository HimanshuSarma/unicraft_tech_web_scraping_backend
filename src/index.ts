import express, { Express } from "express";
import cors from "cors";
import { indexRouter } from "./routes";
import { initializeBrowser } from "./services/webscraper/scraper";

const app: Express = express();

const PORT = 8000;

app.use(cors({
  origin: "*"
}));
app.use(express.json());

app.use(indexRouter);

app.listen(
  PORT,
  async () => {
    console.log(`Server listening on ${PORT}`);
    await initializeBrowser(); // <-- initializeBrowser() is called right here! 
  }
);
