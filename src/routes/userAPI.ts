import express from "express";
import { Request, Response } from "express";
import { users, accessTokens } from "../databases/mongoDB";
import jwt = require("jsonwebtoken");

if (!process.env.JWT_ACCESS_SECRET) {
  console.error("JWT access token not set.");
  process.exit(1);
}
if (!process.env.JWT_REFRESH_SECRET) {
  console.error("JWT refresh token not set.");
  process.exit(1);
}

const router = express.Router();

router.post("/register", async (req: Request, res: Response) => {
  const { email, password, name, accessToken } = req.body;
  if (!email || !password || !name || !accessToken) {
    res.status(400).json({ success: false, error: "Invalid request" });
    return;
  }
  // Verify if the access token is valid
  let tokenObject;
  try {
    tokenObject = await accessTokens.findOne(accessToken);
    if (!tokenObject) {
      res.status(403).json({ success: false, error: "Invalid access token." });
      return;
    }
  } catch (error) {
    console.error("Failed to find access token:", error);
    res.status(500).json({ error: "Failed to verify access token." });
  }
  // Register the user
  try {
    const created = await users.register(email, password, name);
    if (created) {
      accessTokens.remove(tokenObject._id);
      res.status(201).json({ success: true });
    } else {
      res.status(409).json({ success: false, error: "User already exists." });
    }
  } catch (error) {
    console.error("Failed to register user:", error);
    res.status(500).json({ error: "Failed to register user" });
  }
});

router.post("/login", async (req: Request, res: Response) => {
  const { email, password } = req.body;
  if (!email || !password) {
    res.status(400).json({ success: false, error: "Invalid request" });
    return;
  }

  try {
    const correctCredential = await users.login(email, password);
    if (correctCredential) {
      // TODO: implement session management
      const token = jwt.sign({ email }, process.env.JWT_ACCESS_SECRET as string);
      res.status(200).json({ success: true, token });
    } else {
      res.status(401).json({ success: false, error: "Invalid email or password" });
    }
  } catch (error) {
    console.error("Failed to login user:", error);
    res.status(500).json({ error: "Failed to login user" });
  }
});

export default router;
