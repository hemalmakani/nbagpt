import { DataAPIClient } from "@datastax/astra-db-ts";
import { PuppeteerWebBaseLoader } from "@langchain/community/document_loaders/web/puppeteer";

import { OpenAI } from "openai";

import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
import "dotenv/config";

// Used to determine the similarity between two vectors
type SimilarityMetric = "dot_product" | "cosine" | "euclidean";

const {
  ASTRA_DB_NAMESPACE,
  ASTRA_DB_COLLECTION,
  ASTRA_DB_API_ENDPOINT,
  ASTRA_DB_APPLICATION_TOKEN,
  OPENAI_API_KEY,
} = process.env;

const openai = new OpenAI({
  apiKey: OPENAI_API_KEY,
});

const nbaData = [
  "https://www.nba.com/standings",
  "https://www.nba.com/stats/players",
  "https://en.wikipedia.org/wiki/2024%E2%80%9325_NBA_season",
  "https://www.nba.com/news",
  "https://en.wikipedia.org/wiki/2024_NBA_draft",
  "https://en.wikipedia.org/wiki/2025_NBA_draft",
  "https://en.wikipedia.org/wiki/2025_NBA_All-Star_Game",
  "https://en.wikipedia.org/wiki/List_of_2024%E2%80%9325_NBA_season_transactions",
  "https://www.nba.com/playoffs/2024/nba-finals",
  "https://www.espn.com/nba/scoreboard",
  "https://www.nba.com/news/2024-25-nba-regular-season-schedule",
  "https://www.nba.com/news/2024-25-nba-trade-tracker",
];

const client = new DataAPIClient(ASTRA_DB_APPLICATION_TOKEN);
const db = client.db(ASTRA_DB_API_ENDPOINT, { namespace: ASTRA_DB_NAMESPACE });

// chunkSize : Refers to the number of characters in each chunk
// chunkOverlap : Refers to the overlapping characters between chunks
// Helps preserve cross chunk context incase information is cutoff between chunks
const splitter = new RecursiveCharacterTextSplitter({
  chunkSize: 512,
  chunkOverlap: 100,
});
// default length of embedding vector is 1536
const createCollection = async (
  similarityMetric: SimilarityMetric = "dot_product"
) => {
  const res = await db.createCollection(ASTRA_DB_COLLECTION, {
    vector: {
      dimension: 1536,
      metric: similarityMetric,
    },
  });
  console.log(res);
};

const loadSampleData = async () => {
  const collection = await db.collection(ASTRA_DB_COLLECTION);

  for (const url of nbaData) {
    const content = await scrapePage(url);
    const chunks = await splitter.splitText(content);

    for (const chunk of chunks) {
      // Get embeddings from OpenAI
      const embeddingResponse = await openai.embeddings.create({
        model: "text-embedding-3-small",
        input: chunk,
        encoding_format: "float",
      });

      const vector = embeddingResponse.data[0].embedding;

      // Insert document with vector in a single operation
      const res = await collection.insertOne({
        $vector: vector,
        text: chunk,
        source_url: url,
      });

      console.log(`Inserted document: ${res}`);
    }

    console.log(`Processed URL: ${url}`);
  }

  console.log("Data loading complete!");
};

const scrapePage = async (url: string) => {
  const loader = new PuppeteerWebBaseLoader(url, {
    launchOptions: {
      headless: true,
    },
    gotoOptions: {
      waitUntil: "domcontentloaded",
    },
    evaluate: async (page, browser) => {
      const result = await page.evaluate(() => document.body.innerHTML);
      await browser.close();
      return result;
    },
  });
  return (await loader.scrape())?.replace(/<[^>]*>?/gm, "");
};

createCollection().then(() => loadSampleData());
