import express from "express";
import bodyParser from "body-parser";
import cors from "cors";
import Replicate from "replicate";
import "dotenv/config";
import { Request, Response } from "express";
import formatPrompt from "./utils/formatPrompt";

const app = express();
const port = process.env.PORT || 3000;

const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN,
});

app.use(cors()); // todo later - allow only specific origins
app.use(bodyParser.json());

app.post("/", async (req: Request, res: Response) => {
  console.log(req.body);
  if (!req.body || !req.body.systemPrompt || !req.body.userPrompt) {
    res.status(400).json({ success: false, error: "Invalid request" });
    return;
  }

  const input = {
    prompt: formatPrompt(req.body.systemPrompt, req.body.userPrompt),
  };

  let output: Array<string>;
  try {
    output = (await replicate.run("meta/meta-llama-3-70b-instruct", { input })) as Array<string>;
  } catch (e) {
    res.status(500).json({ success: false, error: "Prediction failed." });
    return;
  }

  res.json({
    success: true,
    content: output.join(""),
  });
});

app.get("/", (req: Request, res: Response) => {
  res.send("Chat ITP server is running!");
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});