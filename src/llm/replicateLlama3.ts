import Replicate from "replicate";
import { searchProjectsByText } from "../databases/milvus";
import { ChatSessionModel } from "../databases/mongoDB";
import {
  initialize as initMemory,
  getMessageMemory,
  addMessage,
  clearMessageMemory,
  MessageType
} from "./sessions";
import { v4 as uuidv4 } from 'uuid';

const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN,
});

/**
 * Initialize the chat system with a system prompt.
 * @param {string} systemPrompt - The system prompt to initialize the chat session.
 */
async function initialize(systemPrompt: string) {
  initMemory(systemPrompt);
}

/**
 * Initialize the chat session with a series of messages.
 * @param {MessageType[]} messages - An array of messages to initialize the chat session.
 */
async function initializeWithMessages(messages: MessageType[]) {
  clearMessageMemory();
  for (const message of messages) {
    addMessage(message.content, message.role);
  }
}

/**
 * Generate a response from the AI model based on the user prompt.
 * @param {string} userPrompt - The user prompt to generate a response for.
 * @returns {Promise<string>} - Returns the AI-generated response.
 */
async function generate(userPrompt: string) {
  try {
    // Intent classification using the LLM
    const intentClassificationPrompt = `Classify the following user query about projects. 
Respond with one of these exact labels:
YES_RANDOM - if the user is asking for any random project
YES_SPECIFIC - if the user is asking about a specific project or a project with specific attributes
NO - if the query is not about projects

Examples:
Query: Show me a random project
Answer: YES_RANDOM

Query: Tell me about a project that uses machine learning
Answer: YES_SPECIFIC

Query: What's the weather like today?
Answer: NO

Query: Tell me about a project that has color blue
Answer: YES_SPECIFIC

Now classify this query:
Query: ${userPrompt}
Answer:`;

    const intentOutput = await replicate.run("meta/meta-llama-3-70b-instruct", { input: { prompt: intentClassificationPrompt } }) as string[];

    const intentResult = intentOutput.join('').replace(/\n/g, '').trim().toUpperCase();

    let relevantProjectsText = "";
    if (intentResult.includes('YES_RANDOM') || intentResult.includes('YES_SPECIFIC')) {
      if (intentResult.includes('YES_RANDOM')) {
        const randomProject = await getRandomProject();
        relevantProjectsText = randomProject.text;
      } else {
        const searchResults = await searchProjectsByText(userPrompt);
        relevantProjectsText = searchResults.map(result => result.text).join("\n");
      }
    }

    // Limit conversation history to last 10 messages
    const recentHistory = getMessageMemory().slice(-10);
    const systemPromptAndHistory = recentHistory
      .map((msg) => `${msg.role}: ${msg.content}`)
      .join("\n");

    const newUserPrompt = `user: ${userPrompt}`;

    const inputPrompt = `
    system: You are an AI assistant specializing in discussing projects. Use the provided project information to answer queries accurately. If no project info is given, respond based on general knowledge.

    ${systemPromptAndHistory}

    ${newUserPrompt}

    ${relevantProjectsText ? `Relevant project information:\n${relevantProjectsText}\n` : ''}

    Please provide a response that directly addresses the user's query. If project information is available, incorporate it into your answer.

    assistant:`;

    const output = await replicate.run("meta/meta-llama-3-70b-instruct", { input: { prompt: inputPrompt } });
    
    let aiResponse: string;
    if (Array.isArray(output)) {
      aiResponse = output.join("");
    } else if (typeof output === 'string') {
      aiResponse = output;
    } else {
      throw new Error("Unexpected output format from Replicate API");
    }

    addMessage(userPrompt, "user");
    addMessage(aiResponse, "assistant");

    return aiResponse;
  } catch (error) {
    throw new Error("Failed to generate response.");
  }
}

/**
 * Get a random project from the database.
 * @returns {Promise<any>} - Returns a random project.
 */
async function getRandomProject(): Promise<any> {
  const projects = await searchProjectsByText("project");
  const randomIndex = Math.floor(Math.random() * projects.length);
  return projects[randomIndex];
}

/**
 * Save the current chat session to the database.
 * @param {string} [sessionId] - (optional) The session ID to save the chat session under.
 * @returns {Promise<string>} - Returns the session ID.
 */
async function saveChatSession(sessionId?: string) {
  try {
    const messages = getMessageMemory();
    if (!sessionId) {
      sessionId = uuidv4();
    }
    const session = await ChatSessionModel.findOne({ sessionId });

    if (session) {
      session.messages = messages;
      await session.save();
    } else {
      const newSession = new ChatSessionModel({ sessionId, messages });
      await newSession.save();
    }
    return sessionId;
  } catch (error) {
    console.error("Error saving session:", error);
    throw new Error("Failed to save session.");
  }
}

/**
 * Retrieve all chat session IDs from the database.
 * @returns {Promise<string[]>} - Returns an array of session IDs.
 */
async function getAllSessionIds() {
  try {
    const sessions = await ChatSessionModel.find({}, 'sessionId');
    return sessions.map(session => session.sessionId);
  } catch (error) {
    console.error("Error fetching session IDs:", error);
    throw new Error("Failed to fetch session IDs.");
  }
}

/**
 * Load a chat session from the database by session ID.
 * @param {string} sessionId - The session ID to load the chat session from.
 * @returns {Promise<MessageType[]>} - Returns an array of messages from the loaded session.
 */
async function loadChatSession(sessionId: string) {
  try {
    const session = await ChatSessionModel.findOne({ sessionId });
    if (session) {
      await initializeWithMessages(session.messages);
      return session.messages;
    } else {
      throw new Error("Session not found");
    }
  } catch (error) {
    console.error("Error loading session:", error);
    throw new Error("Failed to load session.");
  }
}

export { initialize, generate, saveChatSession, loadChatSession, getAllSessionIds };