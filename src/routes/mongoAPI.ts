import express from "express";
import { Request, Response } from "express";
import { getProjects, getProjectCount } from "../databases/mongoDB";
import mongoose from "mongoose";

const promptSchema = new mongoose.Schema({
  title: String,
  type: String,
  system_prompt: String,
  main_prompt: String,
  created_at: { type: Date, default: Date.now },
});

promptSchema.index({ title: 1, type: 1 }, { unique: true });

const Prompt = mongoose.model("Prompt", promptSchema);

const router = express.Router();

router.get("/projectCount", async (req: Request, res: Response) => {
  try {
    const count = await getProjectCount();
    console.log("Project count fetched:", count);
    res.json({ count });
  } catch (error) {
    console.error("Failed to fetch project count:", error);
    res.status(500).json({ error: "Failed to fetch project count" });
  }
});

router.get("/getPaginated", async (req: Request, res: Response) => {
  const limit = parseInt(req.query.limit as string) || 10;
  const offset = parseInt(req.query.offset as string) || 0;

  if (limit > 50) {
    return res.status(400).json({ error: "Limit cannot exceed 50" });
  }

  if (offset < 0) {
    return res.status(400).json({ error: "Offset cannot be negative" });
  }

  try {
    const projects = await getProjects(limit, offset);
    console.log(`Projects fetched with limit ${limit} and offset ${offset}:`, projects);
    res.json(projects);
  } catch (error) {
    console.error("Failed to fetch projects:", error);
    res.status(500).json({ error: "Failed to fetch projects" });
  }
});

router.get("/prompts", async (req: Request, res: Response) => {
  try {
    const prompts = await Prompt.find().sort({ created_at: -1 });
    res.json(prompts);
  } catch (error) {
    console.error("Failed to fetch prompts:", error);
    res.status(500).json({ error: "Failed to fetch prompts" });
  }
});

router.post("/prompts", async (req: Request, res: Response) => {
  try {
    const { title, type, system_prompt, main_prompt } = req.body;

    // check if a prompt with the same title and type already exists
    const existingPrompt = await Prompt.findOne({ title, type });
    if (existingPrompt) {
      console.warn("A prompt with this title and type already exists:", { title, type });
      return res.status(400).json({ error: "A prompt with this title and type already exists" });
    }

    const newPrompt = new Prompt({ title, type, system_prompt, main_prompt });
    await newPrompt.save();
    console.log("New prompt saved:", newPrompt);
    res.status(201).json(newPrompt);
  } catch (error) {
    console.error("Failed to save prompt:", error);
    res.status(500).json({ error: "Failed to save prompt" });
  }
});

router.put("/prompts/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { title, type, system_prompt, main_prompt } = req.body;

    const existingPrompt = await Prompt.findOne({ title, type, _id: { $ne: id } });
    if (existingPrompt) {
      console.warn("A prompt with this title and type already exists:", { title, type });
      return res.status(400).json({ error: "A prompt with this title and type already exists" });
    }

    const updatedPrompt = await Prompt.findByIdAndUpdate(
      id,
      { title, type, system_prompt, main_prompt },
      { new: true }
    );
    if (!updatedPrompt) {
      console.warn("Prompt not found for updating:", id);
      return res.status(404).json({ error: "Prompt not found" });
    }
    console.log("Prompt updated:", updatedPrompt);
    res.json(updatedPrompt);
  } catch (error) {
    console.error("Failed to update prompt:", error);
    res.status(500).json({ error: "Failed to update prompt" });
  }
});

router.delete("/prompts/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    console.log("Deleting prompt with ID:", id);
    const deletedPrompt = await Prompt.findByIdAndDelete(id);
    if (!deletedPrompt) {
      console.warn("Prompt not found for deletion:", id);
      return res.status(404).json({ error: "Prompt not found" });
    }
    console.log("Prompt deleted successfully:", id);
    res.status(200).json({ message: "Prompt deleted successfully" });
  } catch (error) {
    console.error("Failed to delete prompt:", error);
    res.status(500).json({ error: "Failed to delete prompt" });
  }
});

export default router;

