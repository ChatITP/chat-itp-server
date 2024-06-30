import { Request, Response, NextFunction } from "express";
import { verifyAccessToken } from "../auth/jwt";

declare module "express-serve-static-core" {
  interface Request {
    user?: any;
  }
}

function authenticateToken(req: Request, res: Response, next: NextFunction) {
  if (!req.get("Authorization")) {
    res.status(401).json({ success: false, error: "Unauthorized" });
    return;
  }
  const authHeader = req.get("Authorization") as string;

  const token = authHeader.split(" ")[1];

  const user = verifyAccessToken(token);
  if (user === null) {
    res.status(403).json({ success: false, error: "Forbidden" });
    return;
  }
  req.user = user;
  next();
}

export default authenticateToken;
