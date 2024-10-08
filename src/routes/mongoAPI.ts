import express from "express";
import { Request, Response } from "express";
import { projects, prompts } from "../databases/mongoDB";
import Report, {IReport} from "../databases/mongoDB/Report";

const router = express.Router();

router.post("/reports", async (req: Request, res: Response) => {
  try {
    const { type, title, description, email } = req.body;

    const newReport: IReport = new Report({
      type,
      title,
      description,
      email
    });

    const savedReport = await newReport.save();
    res.status(201).json(savedReport);
  } catch (error) {
    console.error("Failed to save report:", error);
    res.status(500).json({ error: "Failed to save report" });
  }
});

router.get("/projectCount", async (req: Request, res: Response) => {
  try {
    const count = await projects.count();
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
    res.json(projectList);
  } catch (error) {
    console.error("Failed to fetch projects:", error);
    res.status(500).json({ error: "Failed to fetch projects" });
  }
});

router.get("/cleanProjectCount", async (req: Request, res: Response) => {
  try {
    const count = await projects.count();
    res.json({ count });
  } catch (error) {
    console.error("Failed to fetch cleaned project count:", error);
    res.status(500).json({ error: "Failed to fetch cleaned project count" });
  }
});

router.get("/getCleanPaginated", async (req: Request, res: Response) => {
  const limit = parseInt(req.query.limit as string) || 10;
  const offset = parseInt(req.query.offset as string) || 0;
  const searchQuery = (req.query.search as string) || null;

  if (limit > 50) {
    return res.status(400).json({ error: "Limit cannot exceed 50" });
  }

  if (offset < 0) {
    return res.status(400).json({ error: "Offset cannot be negative" });
  }

  try {
    const projectList = await projects.get(limit, offset, searchQuery);
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

    const updatedProject = await projects.findByIdAndUpdate(projectId, updateData);

    if (!updatedProject) {
      return res.status(404).json({ error: "Project not found" });
    }

    res.json(updatedProject);
  } catch (error) {
    console.error("Failed to update project:", error);
    res.status(500).json({ error: "Failed to update project" });
  }
});

router.get("/prompts", async (req: Request, res: Response) => {
  try {
    const { title, type } = req.query;
    let promptList;
    
    if (title && type) {
      promptList = await prompts.getByTitleAndType(title as string, type as string);
      promptList = Array.isArray(promptList) ? promptList : [promptList];
    } else {
      promptList = await prompts.get();
    }
    
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
    res.json(updatedPrompt);
  } catch (error) {
    console.error("Failed to update prompt:", error);
    res.status(500).json({ error: "Failed to update prompt" });
  }
});

router.delete("/prompts/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const deletedPrompt = await prompts.remove(id);
    if (!deletedPrompt) {
      console.warn("Prompt not found for deletion:", id);
      return res.status(404).json({ error: "Prompt not found" });
    }
    res.status(200).json({ message: "Prompt deleted successfully" });
  } catch (error) {
    console.error("Failed to delete prompt:", error);
    res.status(500).json({ error: "Failed to delete prompt" });
  }
});

export default router;
