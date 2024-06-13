import express from "express";
import { Request, Response } from "express";
import { initialize, generate } from "../llm/replicateLlama3";

const router = express.Router();

router.post("/initialize", async (req: Request, res: Response) => {
  if (!req.body || !req.body.systemPrompt) {
    res.status(400).json({ success: false, error: "Invalid request" });
    return;
  }
  await initialize(req.body.systemPrompt);

  res.json({ success: true });
});

router.post("/generate", async (req: Request, res: Response) => {
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

export default router;
