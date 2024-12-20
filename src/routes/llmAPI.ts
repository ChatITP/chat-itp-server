import express from "express";
import { Request, Response } from "express";
import {
  initialize,
  generate,
  saveChatSession,
  loadChatSession,
  initializeWithMessages,
  generateSuggestions,
  splitPhrase,
  replacePhrase,
  getAllSessions,
} from "../llm/replicateLlama3";

const router = express.Router();

/**
 * POST /initialize
 * Initialize the system with a system prompt.
 * @param {string} systemPrompt - The system prompt to initialize the chat session.
 * @returns {object} - JSON response indicating success or failure.
 */
router.post("/initialize", async (req: Request, res: Response) => {
  const { systemPrompt } = req.body;
  console.log(req.user);
  if (!systemPrompt || !req.user?.userId) {
    return res.status(400).json({ success: false, error: "Invalid request" });
  }
  await initialize(req.user.userId, systemPrompt);
  res.json({ success: true });
});

/**
 * POST /initialize-with-messages
 * Initialize the system with a series of messages.
 * @param {MessageType[]} messages - An array of messages to initialize the chat session.
 * @returns {object} - JSON response indicating success or failure.
 */
router.post("/initialize-with-messages", async (req: Request, res: Response) => {
  const { messages } = req.body;
  if (!Array.isArray(messages) || messages.length === 0 || !req.user?.userId) {
    return res
      .status(400)
      .json({ success: false, error: "Invalid request. Messages array is required." });
  }

  try {
    await initializeWithMessages(req.user.userId, messages);
    res.json({ success: true });
  } catch (e) {
    console.error("Error initializing with messages:", e);
    res.status(500).json({ success: false, error: "Failed to initialize with messages." });
  }
});

router.post("/suggestions", async (req, res) => {
  try {
    const { text } = req.body;
    const suggestions = await generateSuggestions(text);
    res.json(suggestions);
  } catch (error) {
    res.status(500).json({ error: "Failed to generate suggestions" });
  }
});

router.post("/split", async (req, res) => {
  try {
    const { text } = req.body;
    const split = await splitPhrase(text as string);
    res.json({ split });
  } catch (error) {
    res.status(500).json({ error: "Failed to split phrase" });
  }
});

router.post("/replace", async (req, res) => {
  try {
    const { text } = req.body;
    const replacements = await replacePhrase(text as string);
    res.json(replacements);
  } catch (error) {
    res.status(500).json({ error: "Failed to replace phrase" });
  }
});

/**
 * POST /generate
 * Generate an AI response or image based on the user prompt.
 * @param {string} userPrompt - The user prompt to generate a response for.
 * @returns {object} - JSON response with the generated AI content (text or image URL) or an error message.
 */
router.post("/generate", async (req: Request, res: Response) => {
  const { userPrompt } = req.body;
  if (typeof userPrompt !== "string" || !req.user?.userId) {
    return res.status(400).json({ success: false, error: "Invalid request" });
  }
  try {
    const result = await generate(userPrompt, req.user.userId);
    if (result.type === "image") {
      const { imageUrl, text } = result.content;
      res.json({ success: true, type: "image", content: { imageUrl, text } });
    } else {
      res.json({ success: true, type: result.type, content: result.content });
    }
  } catch (e) {
    console.error("Error:", e);
    res.status(500).json({ success: false, error: "Generation failed." });
  }
});

/**
 * POST /save-session
 * Save the current chat session to the database.
 * @param {string} sessionId - (optional) The session ID to save the chat session under.
 * @returns {object} - JSON response indicating success or failure, with the session ID.
 */
router.post("/save-session", async (req: Request, res: Response) => {
  try {
    if (!req.user?.userId) {
      return res.status(400).json({ success: false, error: "Invalid request" });
    }
    const sessionId = await saveChatSession(req.user.userId, req.body.sessionId);
    res.json({ success: true, sessionId });
  } catch (e) {
    console.error("Error saving session:", e);
    res.status(500).json({ success: false, error: "Failed to save session." });
  }
});

/**
 * POST /load-session
 * Load a chat session from the database.
 * @param {string} sessionId - The session ID to load the chat session from.
 * @returns {object} - JSON response with the loaded messages or an error message.
 */
router.post("/load-session", async (req: Request, res: Response) => {
  try {
    if (!req.user?.userId || !req.body.sessionId) {
      return res.status(400).json({ success: false, error: "Invalid request" });
    }
    const messages = await loadChatSession(req.user.userId, req.body.sessionId);
    res.json({ success: true, messages });
  } catch (e) {
    console.error("Error loading session:", e);
    res.status(500).json({ success: false, error: "Failed to load session." });
  }
});

/**
 * GET /sessions
 * Retrieve all chat session objects from the database.
 * @returns {object} - JSON response with a list of session objects or an error message.
 */
router.get("/sessions", async (req: Request, res: Response) => {
  try {
    if (!req.user?.userId) {
      return res.status(400).json({ success: false, error: "Invalid request" });
    }
    const sessions = await getAllSessions(req.user.userId);
    res.json({ success: true, sessions });
  } catch (e) {
    console.error("Error fetching sessions:", e);
    res.status(500).json({ success: false, error: "Failed to fetch sessions." });
  }
});

export default router;
