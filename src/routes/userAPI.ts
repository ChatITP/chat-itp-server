import express from "express";
import { Request, Response } from "express";
import { users, earlyAccessCodes, refreshTokens } from "../databases/mongoDB";
import { generateAccessToken, generateRefreshToken, verifyRefreshToken } from "../auth/jwt";

const router = express.Router();

router.post("/register", async (req: Request, res: Response) => {
  const { email, password, name, earlyAccessCode } = req.body;
  if (!email || !password || !name || !earlyAccessCode) {
    res.status(400).json({ success: false, error: "Invalid request" });
    return;
  }
  // Verify if the access token is valid
  let earlyAccessCodeObject;
  try {
    earlyAccessCodeObject = await earlyAccessCodes.findOne(earlyAccessCode);
    if (!earlyAccessCodeObject) {
      res.status(403).json({ success: false, error: "Invalid early access code." });
      return;
    }
  } catch (error) {
    console.error("Failed to verify access token:", error);
    res.status(500).json({ error: "Failed to verify access token." });
  }
  // Register the user
  try {
    const created = await users.register(email, password, name);
    if (created) {
      earlyAccessCodes.remove(earlyAccessCodeObject._id);
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
      const accessToken = generateAccessToken(email);
      const refreshToken = generateRefreshToken(email);

      res.cookie("accessToken", accessToken, { httpOnly: true, path: "/" });
      res.cookie("refreshToken", refreshToken, {
        httpOnly: true,
        path: "/user",
      });

      // Save the refresh token
      refreshTokens.create(refreshToken);
      res.status(200).json({ success: true });
    } else {
      res.status(401).json({ success: false, error: "Invalid email or password" });
    }
  } catch (error) {
    console.error("Failed to login user:", error);
    res.status(500).json({ error: "Failed to login user" });
  }
});

router.post("/refresh", async (req: Request, res: Response) => {
  const refreshToken = req.cookies.refreshToken;
  if (!refreshToken) {
    res.status(401).json({ success: false, error: "No refresh token" });
    return;
  }

  try {
    const refreshTokenObject = await refreshTokens.findOne(refreshToken);
    if (!refreshTokenObject) {
      res.status(403).json({ success: false, error: "Invalid refresh token" });
      return;
    }
  } catch (error) {
    console.error("Failed to refresh token:", error);
    res.status(500).json({ error: "Failed to validate refresh token" });
    return;
  }

  const user = verifyRefreshToken(refreshToken);
  if (!user) {
    res.status(403).json({ success: false, error: "Invalid refresh token" });
    return;
  }
  const accessToken = generateAccessToken(user.email);
  res.cookie("accessToken", accessToken, { httpOnly: true, path: "/" });
  res.status(200).json({ success: true });
});

router.post("/logout", async (req: Request, res: Response) => {
  const refreshToken = req.cookies.refreshToken;
  try {
    const refreshTokenObject = await refreshTokens.findOne(refreshToken);
    console.log(refreshTokenObject);
    if (refreshTokenObject) {
      await refreshTokens.remove(refreshTokenObject._id);
    }
  } catch (error) {
    console.error("Failed to logout user:", error);
    res.status(500).json({ error: "Failed to logout user" });
    return;
  }

  res.clearCookie("accessToken");
  res.clearCookie("refreshToken");

  res.status(200).json({ success: true });
});

export default router;
