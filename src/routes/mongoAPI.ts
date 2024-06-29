import express from "express";
import { Request, Response } from "express";
import { projects, prompts } from "../databases/mongoDB";

const router = express.Router();

router.get("/projectCount", async (req: Request, res: Response) => {
  try {
    const count = await projects.count();
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
    const projectList = await projects.getRaw(limit, offset);
    console.log(`Projects fetched with limit ${limit} and offset ${offset}:`, projectList);
    res.json(projectList);
  } catch (error) {
    console.error("Failed to fetch projects:", error);
    res.status(500).json({ error: "Failed to fetch projects" });
  }
});

router.get("/cleanProjectCount", async (req: Request, res: Response) => {
  try {
    const count = await projects.count();
    console.log("Cleaned project count fetched:", count);
    res.json({ count });
  } catch (error) {
    console.error("Failed to fetch cleaned project count:", error);
    res.status(500).json({ error: "Failed to fetch cleaned project count" });
  }
});

router.get("/getCleanPaginated", async (req: Request, res: Response) => {
  const limit = parseInt(req.query.limit as string) || 10;
  const offset = parseInt(req.query.offset as string) || 0;

  if (limit > 50) {
    return res.status(400).json({ error: "Limit cannot exceed 50" });
  }

  if (offset < 0) {
    return res.status(400).json({ error: "Offset cannot be negative" });
  }

  try {
    const projectList = await projects.get(limit, offset);
    res.json(projectList);
  } catch (error) {
    console.error("Failed to fetch cleaned projects:", error);
    res.status(500).json({ error: "Failed to fetch cleaned projects" });
  }
});

router.put("/updateProject/:projectId", async (req: Request, res: Response) => {
  try {
    const { projectId } = req.params;
    const updateData = req.body;

    console.log("Received update request for project ID:", projectId);
    console.log("Update data:", updateData);

    const updatedProject = await projects.findByIdAndUpdate(projectId, updateData);

    if (!updatedProject) {
      return res.status(404).json({ error: "Project not found" });
    }

    console.log("Project updated with id: ", updatedProject.project_id);
    res.json(updatedProject);
  } catch (error) {
    console.error("Failed to update project:", error);
    res.status(500).json({ error: "Failed to update project" });
  }
});

router.get("/prompts", async (req: Request, res: Response) => {
  try {
    const promptList = await prompts.get();
    res.json(promptList);
  } catch (error) {
    console.error("Failed to fetch prompts:", error);
    res.status(500).json({ error: "Failed to fetch prompts" });
  }
});

router.post("/prompts", async (req: Request, res: Response) => {
  try {
    const { title, type, system_prompt, main_prompt } = req.body;

    // check if a prompt with the same title and type already exists
    const existingPrompt = await prompts.getByTitleAndType(title, type);
    if (existingPrompt) {
      console.warn("A prompt with this title and type already exists:", { title, type });
      return res.status(400).json({ error: "A prompt with this title and type already exists" });
    }
    const newPrompt = await prompts.create(title, type, system_prompt, main_prompt);
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

    const existingPrompt = await prompts.getByTitleTypeAndNotId(title, type, id);
    if (existingPrompt) {
      console.warn("A prompt with this title and type already exists:", { title, type });
      return res.status(400).json({ error: "A prompt with this title and type already exists" });
    }

    const updatedPrompt = await prompts.update(id, title, type, system_prompt, main_prompt);
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
    const deletedPrompt = await prompts.remove(id);
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
