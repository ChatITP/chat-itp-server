import { Request, Response, NextFunction } from "express";
import { verifyAccessToken } from "../auth/jwt";

declare module "express-serve-static-core" {
  interface Request {
    user?: any;
  }
}

function authenticateToken(req: Request, res: Response, next: NextFunction) {
  const accessToken = req.cookies.accessToken;
  if (!accessToken) {
    res.status(401).json({ success: false, error: "No access token" });
    return;
  }

  const user = verifyAccessToken(accessToken);
  if (user === null) {
    res.status(403).json({ success: false, error: "Access token invalid" });
    return;
  }
  req.user = { userId: user.userId, ...user };
  next();
}

export default authenticateToken;