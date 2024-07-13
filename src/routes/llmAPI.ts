import express from "express";
import { Request, Response } from "express";
import {
  initialize,
  generate,
  saveChatSession,
  loadChatSession,
  getAllSessionIds,
  initializeWithMessages
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
  if (!systemPrompt) {
    return res.status(400).json({ success: false, error: "Invalid request" });
  }
  await initialize(systemPrompt);
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
  if (!Array.isArray(messages) || messages.length === 0) {
    return res.status(400).json({ success: false, error: "Invalid request. Messages array is required." });
  }

  try {
    await initializeWithMessages(messages);
    res.json({ success: true });
  } catch (e) {
    console.error("Error initializing with messages:", e);
    res.status(500).json({ success: false, error: "Failed to initialize with messages." });
  }
});

/**
 * POST /generate
 * Generate an AI response based on the user prompt.
 * @param {string} userPrompt - The user prompt to generate a response for.
 * @returns {object} - JSON response with the generated AI content or an error message.
 */
router.post("/generate", async (req: Request, res: Response) => {
  const { userPrompt } = req.body;
  if (!userPrompt) {
    return res.status(400).json({ success: false, error: "Invalid request" });
  }
  try {
    const aiResponse = await generate(userPrompt);
    res.json({ success: true, content: aiResponse });
  } catch (e) {
    console.error("Error:", e);
    res.status(500).json({ success: false, error: "Prediction failed." });
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
    const sessionId = await saveChatSession(req.body.sessionId);
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
  const { sessionId } = req.body;
  if (!sessionId) {
    return res.status(400).json({ success: false, error: "Invalid request" });
  }
  try {
    const messages = await loadChatSession(sessionId);
    res.json({ success: true, messages });
  } catch (e) {
    console.error("Error loading session:", e);
    res.status(500).json({ success: false, error: "Failed to load session." });
  }
});

/**
 * GET /sessions
 * Retrieve all chat session IDs from the database.
 * @returns {object} - JSON response with a list of session IDs or an error message.
 */
router.get("/sessions", async (req: Request, res: Response) => {
  try {
    const sessionIds = await getAllSessionIds();
    res.json({ success: true, sessionIds });
  } catch (e) {
    console.error("Error fetching sessions:", e);
    res.status(500).json({ success: false, error: "Failed to fetch sessions." });
  }
});

export default router;
