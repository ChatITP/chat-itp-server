import express from "express";
import { Request, Response } from "express";
import bodyParser from "body-parser";
import cors from "cors";

import "dotenv/config";

import dbRouter from "./routes/mongoAPI";

import { initialize, generate } from "./llm/replicateLlama3";

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(bodyParser.json());

app.use("/db", dbRouter);

app.post("/initialize", async (req: Request, res: Response) => {
  if (!req.body || !req.body.systemPrompt) {
    res.status(400).json({ success: false, error: "Invalid request" });
    return;
  }
  await initialize(req.body.systemPrompt);

  res.json({ success: true });
});

app.post("/", async (req: Request, res: Response) => {
  if (!req.body || !req.body.userPrompt) {
    res.status(400).json({ success: false, error: "Invalid request" });
    return;
  }
  const aiResponse = await generate(req.body.userPrompt);
  try {
    res.json({ success: true, content: aiResponse });
  } catch (e) {
    console.error("Error:", e);
    res.status(500).json({ success: false, error: "Prediction failed." });
  }
});

app.get("/", (req: Request, res: Response) => {
  res.send("Chat ITP server is running!");
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
