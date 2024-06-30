import { Request, Response, NextFunction } from "express";
import jwt = require("jsonwebtoken");

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

  let user;
  try {
    user = jwt.verify(token, process.env.JWT_ACCESS_SECRET as string);
  } catch (error) {
    res.status(403).json({ success: false, error: "Forbidden" });
    return;
  }
  req.user = user;
  next();
}

export default authenticateToken;
