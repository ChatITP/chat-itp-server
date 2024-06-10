import express from "express";
import bodyParser from "body-parser";
import cors from "cors";
import Replicate from "replicate";
import "dotenv/config";
import { Request, Response } from "express";
import formatPrompt from "./utils/formatPrompt";
import dbRouter from "./routes/mongoAPI";
import { BufferMemory } from "langchain/memory";
import { ChatPromptTemplate, MessagesPlaceholder } from "@langchain/core/prompts";
import { RunnableSequence } from "@langchain/core/runnables";

const app = express();
const port = process.env.PORT || 3000;

const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN,
});

app.use(cors());
app.use(bodyParser.json());

app.use("/db", dbRouter);
const memory = new BufferMemory({ returnMessages: true });

let initialSystemPrompt = "";

app.post("/initialize", async (req: Request, res: Response) => {
  if (!req.body || !req.body.systemPrompt) {
    res.status(400).json({ success: false, error: "Invalid request" });
    return;
  }

  initialSystemPrompt = req.body.systemPrompt;
  // console.log(initialSystemPrompt); 
  memory.clear();
  await memory.saveContext({ input: "initialization" }, { output: initialSystemPrompt });

  res.json({ success: true });
});

app.post("/", async (req: Request, res: Response) => {
  if (!req.body || !req.body.userPrompt) {
    res.status(400).json({ success: false, error: "Invalid request" });
    return;
  }

  const userPrompt = req.body.userPrompt;
  const pastMessages = await memory.loadMemoryVariables({});
  type MessageType = {
    content: string;
  };

  const input = {
    prompt: `${initialSystemPrompt}\n\n${(pastMessages.history as MessageType[])
      .map((msg) => msg.content)
      .join("\n")}\nuser: ${userPrompt}`,
  };

  try {
    const output = await replicate.run("meta/meta-llama-3-70b-instruct", { input });
    const aiResponse = Array.isArray(output) ? output.join("") : output;
    await memory.saveContext({ input: userPrompt }, { output: aiResponse });
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
