import express from "express";
import { Request, Response } from "express";
import { getProjects, getProjectCount } from "../databases/mongoDB";

const router = express.Router();

router.get("/projectCount", async (req: Request, res: Response) => {
  const count = await getProjectCount();
  res.json({ count });
});

router.get("/getPaginated", async (req: Request, res: Response) => {
  const limit = parseInt(req.query.limit as string) || 10;
  const offset = parseInt(req.query.offset as string) || 0;

  if (limit > 50) {
    res.status(400).json({ error: "Limit cannot exceed 50" });
    return;
  }

  if (offset < 0) {
    res.status(400).json({ error: "Offset cannot be negative" });
    return;
  }

  const projects = await getProjects(limit, offset);
  res.json(projects);
});

export default router;
