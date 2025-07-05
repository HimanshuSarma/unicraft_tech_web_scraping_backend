import express, { Express } from "express";
import cors from "cors";
import * as dotenv from "dotenv";
dotenv.config();
import { indexRouter } from "./routes";
import { initializeBrowser } from "./services/webscraper/scraper";
import { getRedisClient } from "./services/redis/connectRedis";

const app: Express = express();

const PORT = process.env.PORT || 8000;

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
    await getRedisClient(); 
  }
);
