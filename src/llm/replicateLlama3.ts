import Replicate from "replicate";
import { searchProjectsByText } from "../databases/milvus";
import { ChatSessionModel } from "../databases/mongoDB";
import {
  initialize as initMemory,
  getMessageMemory,
  addMessage,
  clearMessageMemory,
  MessageType,
} from "./sessions";
import { v4 as uuidv4 } from "uuid";
import { isImageGenerationRequest, generateImage } from "./replicateSD";

const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN,
});

const MAX_FULL_HISTORY = 10;
const SUMMARIZE_THRESHOLD = 50;
const CONTEXT_VALIDATION_INTERVAL = 10;

type ConversationState = {
  discussedProjects: Set<string>;
  keyTopics: string[];
  interactionCount: number;
  systemPrompt: string;
};

let state: ConversationState = {
  discussedProjects: new Set<string>(),
  keyTopics: [],
  interactionCount: 0,
  systemPrompt: "",
};

/**
 * Initialize the chat system with a system prompt.
 * @param {string} systemPrompt - The system prompt to initialize the chat session.
 */
async function initialize(systemPrompt: string) {
  initMemory(systemPrompt);
  state = {
    discussedProjects: new Set<string>(),
    keyTopics: [],
    interactionCount: 0,
    systemPrompt: systemPrompt,
  };
}

async function generateSuggestions(selectedBlocks: string[]): Promise<string[]> {
  const input = selectedBlocks.join(" ");
  const prompt = `You are an AI assistant specializing in ITP (Interactive Telecommunications Program) projects. Analyze the following input about ITP projects: "${input}"

1. First, determine if this is a complete question or statement. If it is, respond with only "COMPLETE".
2. If it's not complete, suggest up to 5 possible next words or short phrases to complete or continue the thought. Focus on topics relevant to ITP such as interactive design, technology, art, and innovation.

Respond with either "COMPLETE" or up to 5 suggested words or short phrases, separated by commas.

Examples:
Input: "What are some popular themes in"
Output: interactive installations, wearable technology, AI art, social impact, design thinking

Input: "How do ITP projects incorporate emerging technologies?"
Output: COMPLETE

Input: "Can you describe a project that"
Output: uses AR, focuses on sustainability, engages community, incorporates AI, addresses accessibility

Now, analyze this:
Input: "${input}"
Output:`;

  const output = (await replicate.run("meta/meta-llama-3.1-405b-instruct", {
    input: { prompt },
  })) as string | string[];

  let response: string;
  if (Array.isArray(output)) {
    response = output.join("").trim();
  } else if (typeof output === "string") {
    response = output.trim();
  } else {
    throw new Error("Unexpected output format from Replicate API");
  }

  if (response === "COMPLETE") {
    return ["?"];
  }

  let suggestions = response.split(",").map((s) => s.trim());
  suggestions = suggestions.filter((s) => s !== "");
  suggestions = suggestions.slice(0, 5);
  while (suggestions.length < 5) {
    suggestions.push("");
  }

  return suggestions;
}

/**
 * A function that splits a long phrase into shorter segments.
 * @param phrase - The long phrase to split.
 * @returns - An array of shorter segments.
 */
async function splitPhrase(phrase: string): Promise<string[]> {
  const prompt = `You are an AI assistant specializing in splitting long phrases into shorter segments.

Respond ONLY with the phrase separated by commas. Always split the question mark into a separate segment if it's present. If the input is already short, return it as is. Try not to split into single words if possible.

Example 1:
Input: "What are some popular themes in ITP"
Output: What are, some popular themes, in ITP

Example 2:
Input: "How do interactive installation make funny sounds"
Output: how do, interactive installation, make funny sounds

Example 3:
Input: "will AI impact the future of technology?"
Output: will AI, impact, the future of, technology, ?



Now, complete this:
Input: "${phrase}"
Output: `;

  const output = (await replicate.run("meta/meta-llama-3.1-405b-instruct", {
    input: { prompt },
  })) as string | string[];

  let splits: string[];

  if (Array.isArray(output)) {
    splits = output
      .join("")
      .split(",")
      .map((s: string) => s.trim());
  } else if (typeof output === "string") {
    splits = output.split(",").map((s: string) => s.trim());
  } else {
    throw new Error("Unexpected output format from Replicate API");
  }

  return splits;
}

/**
 * Initialize the chat session with a series of messages.
 * @param {MessageType[]} messages - An array of messages to initialize the chat session.
 */
async function initializeWithMessages(messages: MessageType[], isLoadingSession: boolean = false) {
  clearMessageMemory();
  for (const message of messages) {
    addMessage(message.content, message.role);
  }
  if (isLoadingSession) {
    await rebuildState(messages);
  }
  // Ensure the system prompt is set when initializing with messages
  const systemMessage = messages.find(m => m.role === 'system');
  if (systemMessage) {
    state.systemPrompt = systemMessage.content;
  }
}

/**
 * Rebuilds the conversation state from a given array of messages.
 * @param {MessageType[]} messages - An array of messages to rebuild the state from.
 */
/**
 * Rebuilds the conversation state from a given array of messages.
 * @param {MessageType[]} messages - An array of messages to rebuild the state from.
 */
async function rebuildState(messages: MessageType[]) {
  // Find the system message to extract the system prompt
  const systemMessage = messages.find(m => m.role === 'system');
  
  state = {
    discussedProjects: new Set<string>(),
    keyTopics: [],
    interactionCount: messages.length,
    systemPrompt: systemMessage ? systemMessage.content : "", // Set the system prompt
  };

  const stateRebuildPrompt = `
  Analyze the following conversation and extract:
  1. A list of all discussed projects
  2. Key topics of the conversation

  Conversation:
  ${messages.map((m) => `${m.role}: ${m.content}`).join("\n")}

  Respond in the following format:
  Projects: [list of projects]
  Topics: [list of key topics]
  `;

  const output = (await replicate.run("meta/meta-llama-3.1-405b-instruct", {
    input: { prompt: stateRebuildPrompt },
  })) as string[];
  const result = output.join("").trim();

  const projectsMatch = result.match(/Projects: (.*)/);
  const topicsMatch = result.match(/Topics: (.*)/);

  if (projectsMatch) {
    projectsMatch[1].split(",").forEach((project) => state.discussedProjects.add(project.trim()));
  }
  if (topicsMatch) {
    state.keyTopics = topicsMatch[1].split(",").map((topic) => topic.trim());
  }

  if (!state.systemPrompt) {
    state.systemPrompt = "You are an AI assistant specializing in discussing projects.";
    console.warn("No system prompt found in messages. Using default system prompt.");
  }
}

/**
 * Summarizes a conversation based on an array of messages.
 * @param {MessageType[]} messages - An array of messages to summarize.
 * @returns {Promise<string>} - A promise that resolves to the summary string.
 */
async function summarizeConversation(messages: MessageType[]): Promise<string> {
  const conversationText = messages.map((msg) => `${msg.role}: ${msg.content}`).join("\n");

  const summarizationPrompt = `
  Summarize the following conversation, focusing on key points, context, and maintaining a coherent narrative. 
  Ensure to capture:
  1. Main topics discussed
  2. Any decisions or conclusions reached
  3. Important questions or issues raised
  
  Keep the summary concise but informative.

  Conversation:
  ${conversationText}

  Summary:`;

  try {
    const output = (await replicate.run("meta/meta-llama-3.1-405b-instruct", {
      input: { prompt: summarizationPrompt },
    })) as string[];
    return output.join("").trim();
  } catch (error) {
    console.error("Error summarizing conversation:", error);
    throw new Error("Failed to summarize conversation.");
  }
}

/**
 * Generate a response from the AI model based on the user prompt.
 * @param {string} userPrompt - The user prompt to generate a response for.
 * @returns {Promise<string>} - Returns the AI-generated response.
 */
async function generate(userPrompt: string): Promise<{ type: string, content: string }> {
  try {
    const isImageRequest = await isImageGenerationRequest(userPrompt);

    if (isImageRequest) {
      const imagePromptCreationPrompt = `
Based on the following user request and conversation context, create a concise and effective prompt for generating an image. The prompt should be simple, direct, and focus on visual elements that image generation models can easily interpret.

User request: ${userPrompt}

Conversation context:
${formatMessages(getMessageMemory().slice(-5))}

Key topics: ${state.keyTopics.join(", ")}

Please provide an image generation prompt that:
1. Uses simple, concrete terms to describe the main subject or scene.
2. Specifies a clear art style (e.g., digital art, photo-realistic, cartoon, oil painting).
3. Mentions 2-3 key colors or a color scheme.
4. Includes a brief description of the overall mood or atmosphere.
5. Adds 1-2 important details that enhance the image without overcomplicating it.

Keep the entire prompt under 75 words. Avoid abstract concepts, technical terms, or overly specific instructions. Do not use verbs like "generate" or "create". Provide only the image generation prompt, without any additional explanation or context.
`;

      const imagePromptOutput = await replicate.run("meta/meta-llama-3.1-405b-instruct", {
        input: { prompt: imagePromptCreationPrompt },
      }) as string | string[] | null;

      let imagePrompt: string;
      if (Array.isArray(imagePromptOutput)) {
        imagePrompt = imagePromptOutput.join("").trim();
      } else if (typeof imagePromptOutput === "string") {
        imagePrompt = imagePromptOutput.trim();
      } else if (imagePromptOutput == null) {
        throw new Error("Received null from Replicate API for image prompt creation");
      } else {
        throw new Error(`Unexpected output type from Replicate API: ${typeof imagePromptOutput}`);
      }

      if (imagePrompt === "") {
        throw new Error("Received empty string from Replicate API for image prompt creation");
      }

      const imageResult = await generateImage(imagePrompt);
      addMessage(userPrompt, "user");
      if (imageResult.success) {
        const responsePrompt = `
Respond directly to the user about the generated image based on their request. Your response should:
1. Briefly acknowledge the user's request
2. Ask the user for their thoughts or if they want any modifications

Do not include any meta-text or prefixes like "Here's a response:" or similar phrases. Start your response immediately addressing the user's request.

User request: ${userPrompt}
Generated image based on: ${imagePrompt}

Your response:`;

        const responseOutput = await replicate.run("meta/meta-llama-3.1-405b-instruct", {
          input: { prompt: responsePrompt },
        }) as string | string[] | null;

        let response: string;
        if (Array.isArray(responseOutput)) {
          response = responseOutput.join("").trim();
        } else if (typeof responseOutput === "string") {
          response = responseOutput.trim();
        } else if (responseOutput == null) {
          response = "Here's the image I've generated based on your request. Let me know if you'd like any changes!";
        } else {
          console.warn("Unexpected response type from Replicate API:", typeof responseOutput);
          response = "I've created an image based on your request. What do you think of it?";
        }

        addMessage(`${response}\n\nImage URL: ${imageResult.content}`, "assistant");
        return { type: "image", content: JSON.stringify({ imageUrl: imageResult.content, text: response }) };
      } else {
        addMessage(imageResult.content, "assistant");
        return { type: "text", content: imageResult.content };
      }
    }
    state.interactionCount++;

    const fullHistory = getMessageMemory();
    let context = "";

    if (fullHistory.length > SUMMARIZE_THRESHOLD) {
      const olderMessages = fullHistory.slice(0, -MAX_FULL_HISTORY);
      const recentMessages = fullHistory.slice(-MAX_FULL_HISTORY);

      const summary = await summarizeConversation(olderMessages);
      context = `Summary of earlier conversation:\n${summary}\n\nRecent messages:\n${formatMessages(
        recentMessages
      )}`;
    } else {
      context = formatMessages(fullHistory);
    }

    context += `\nDiscussed projects: ${Array.from(state.discussedProjects).join(", ")}`;
    context += `\nKey topics: ${state.keyTopics.join(", ")}`;

    const relevantProjectsText = await fetchRelevantProjects(userPrompt);

    const inputPrompt = `
    system: ${state.systemPrompt}

    Conversation context:
    ${context}

    user: ${userPrompt}

    ${relevantProjectsText ? `Relevant project information:\n${relevantProjectsText}\n` : ""}

    Please provide a response that directly addresses the user's query. If project information is available, incorporate it into your answer. Ensure you're not repeating information about projects already discussed unless specifically asked to do so.

    assistant:`;

    const output = await replicate.run("meta/meta-llama-3.1-405b-instruct", {
      input: { prompt: inputPrompt },
    });

    let aiResponse: string;
    if (Array.isArray(output)) {
      aiResponse = output.join("");
    } else if (typeof output === "string") {
      aiResponse = output;
    } else {
      throw new Error("Unexpected output format from Replicate API");
    }

    aiResponse = aiResponse.replace(/Discussed projects:[\s\S]*Key topics:[\s\S]*$/, "").trim();

    addMessage(userPrompt, "user");
    addMessage(aiResponse, "assistant");

    updateState(aiResponse);

    if (state.interactionCount % CONTEXT_VALIDATION_INTERVAL === 0) {
      await validateContext();
    }

    return { type: "text", content: aiResponse };
  } catch (error) {
    console.error("Error generating response:", error);
    throw new Error("Failed to generate response.");
  }
}

/**
 * Fetches relevant projects based on the user's prompt.
 * @param {string} userPrompt - The user's input prompt.
 * @returns {Promise<string>} - A promise that resolves to a string containing relevant project information.
 */
async function fetchRelevantProjects(userPrompt: string): Promise<string> {
  const intentClassificationPrompt = `Classify the following user query about projects. 
  Respond with one of these exact labels:
  YES_RANDOM - if the user is asking for any random project
  YES_SPECIFIC - if the user is asking about a specific project or a project with specific attributes
  NO - if the query is not about projects

  Query: ${userPrompt}
  Answer:`;

  const intentOutput = (await replicate.run("meta/meta-llama-3.1-405b-instruct", {
    input: { prompt: intentClassificationPrompt },
  })) as string[];
  const intentResult = intentOutput.join("").replace(/\n/g, "").trim().toUpperCase();

  let relevantProjectsText = "";
  if (intentResult.includes("YES_RANDOM") || intentResult.includes("YES_SPECIFIC")) {
    if (intentResult.includes("YES_RANDOM")) {
      const uniqueProject = await getUniqueProject();
      relevantProjectsText = uniqueProject.text;
    } else {
      const searchResults = await searchProjectsByText(userPrompt, 5);
      const uniqueResults = searchResults.filter(
        (result) => !state.discussedProjects.has(result.id)
      );
      if (uniqueResults.length > 0) {
        const selectedResult = uniqueResults[Math.floor(Math.random() * uniqueResults.length)];
        state.discussedProjects.add(selectedResult.id);
        relevantProjectsText = selectedResult.text;
      } else {
        relevantProjectsText = "No new relevant projects found.";
      }
    }
  }

  return relevantProjectsText;
}

/**
 * Formats an array of messages into a string representation.
 * @param {MessageType[]} messages - An array of messages to format.
 * @returns {string} - A formatted string representation of the messages.
 */
function formatMessages(messages: MessageType[]): string {
  return messages.map((msg) => `${msg.role}: ${msg.content}`).join("\n");
}

/**
 * Retrieves a unique project that hasn't been discussed before.
 * @returns {Promise<any>} - A promise that resolves to a unique project object.
 */
async function getUniqueProject(): Promise<any> {
  let attempts = 0;
  while (attempts < 10) {
    const project = await getRandomProject();
    if (!state.discussedProjects.has(project.id)) {
      state.discussedProjects.add(project.id);
      return project;
    }
    attempts++;
  }
  throw new Error("Unable to find a unique project after 10 attempts");
}

/**
 * Get a random project from the database.
 * @returns {Promise<any>} - Returns a random project.
 */
async function getRandomProject(): Promise<any> {
  const projects = await searchProjectsByText("project", 10);
  const availableProjects = projects.filter((p) => !state.discussedProjects.has(p.id));

  if (availableProjects.length === 0) {
    state.discussedProjects.clear();
    return getRandomProject();
  }

  const randomIndex = Math.floor(Math.random() * availableProjects.length);
  return availableProjects[randomIndex];
}

/**
 * Updates the conversation state based on the AI's response.
 * @param {string} response - The AI's response to analyze and update the state from.
 */
function updateState(response: string) {
  const updateStatePrompt = `
  Based on the following AI response, identify:
  1. Any new projects mentioned
  2. Key topics discussed

  Response:
  ${response}

  Provide the results in the following format:
  New Projects: [list of new projects]
  Topics: [list of key topics]
  `;

  replicate
    .run("meta/meta-llama-3.1-405b-instruct", { input: { prompt: updateStatePrompt } })
    .then((output: unknown) => {
      const result = Array.isArray(output) ? output.join("").trim() : String(output).trim();

      const projectsMatch = result.match(/New Projects: (.*)/);
      const topicsMatch = result.match(/Topics: (.*)/);

      if (projectsMatch) {
        projectsMatch[1]
          .split(",")
          .forEach((project) => state.discussedProjects.add(project.trim()));
      }
      if (topicsMatch) {
        const newTopics = topicsMatch[1].split(",").map((topic) => topic.trim());
        state.keyTopics = [...new Set([...state.keyTopics, ...newTopics])];
      }
    })
    .catch((error) => {
      console.error("Error updating state:", error);
    });
}

/**
 * Validates and corrects the current conversation context.
 */
async function validateContext() {
  const fullHistory = getMessageMemory();
  const validationPrompt = `
  Review the following conversation history and current state. Identify any inconsistencies or missing information in the state.

  Conversation History:
  ${formatMessages(fullHistory)}

  Current State:
  Discussed Projects: ${Array.from(state.discussedProjects).join(", ")}
  Key Topics: ${state.keyTopics.join(", ")}

  Please provide any corrections or additions to the state in the following format:
  Corrections:
  [List any projects that should be added or removed]
  [List any topics that should be added or removed]
  `;

  try {
    const output = (await replicate.run("meta/meta-llama-3.1-405b-instruct", {
      input: { prompt: validationPrompt },
    })) as string[];
    const result = output.join("").trim();

    const correctionsMatch = result.match(/Corrections:\n([\s\S]*)/);
    if (correctionsMatch) {
      const corrections = correctionsMatch[1].split("\n").map((line) => line.trim());
      corrections.forEach((correction) => {
        if (correction.startsWith("Add project:")) {
          state.discussedProjects.add(correction.replace("Add project:", "").trim());
        } else if (correction.startsWith("Remove project:")) {
          state.discussedProjects.delete(correction.replace("Remove project:", "").trim());
        } else if (correction.startsWith("Add topic:")) {
          state.keyTopics.push(correction.replace("Add topic:", "").trim());
        } else if (correction.startsWith("Remove topic:")) {
          state.keyTopics = state.keyTopics.filter(
            (topic) => topic !== correction.replace("Remove topic:", "").trim()
          );
        }
      });
    }
  } catch (error) {
    console.error("Error validating context:", error);
  }
}

async function saveChatSession(sessionId?: string) {
  try {
    const messages = getMessageMemory();
    if (!sessionId) {
      sessionId = uuidv4();
    }
    const session = await ChatSessionModel.findOne({ sessionId });

    const discussedProjectsArray = Array.from(state.discussedProjects);

    const stateToSave = {
      ...state,
      discussedProjects: discussedProjectsArray,
    };

    if (session) {
      session.messages = messages;
      session.state = stateToSave;
      await session.save();
    } else {
      const newSession = new ChatSessionModel({ sessionId, messages, state: stateToSave });
      await newSession.save();
    }
    return sessionId;
  } catch (error) {
    console.error("Error saving session:", error);
    throw new Error("Failed to save session.");
  }
}

async function loadChatSession(sessionId: string) {
  try {
    const session = await ChatSessionModel.findOne({ sessionId });
    if (session) {
      await initializeWithMessages(session.messages, true);
      state = {
        ...session.state,
        discussedProjects: new Set(session.state.discussedProjects),
      };
      return session.messages;
    } else {
      throw new Error("Session not found");
    }
  } catch (error) {
    console.error("Error loading session:", error);
    throw new Error("Failed to load session.");
  }
}

/**
 * Retrieve all chat session IDs from the database.
 * @returns {Promise<string[]>} - Returns an array of session IDs.
 */
async function getAllSessionIds() {
  try {
    const sessions = await ChatSessionModel.find({}, "sessionId");
    return sessions.map((session) => session.sessionId);
  } catch (error) {
    console.error("Error fetching session IDs:", error);
    throw new Error("Failed to fetch session IDs.");
  }
}

/**
 * Retrieve all chat session objects from the database.
 * @returns {Promise<{ sessionId: string, created_at: string }[]>} - Returns an array of session objects.
 */
async function getAllSessions() {
  try {
    const sessions = await ChatSessionModel.find({}, "sessionId createdAt");
    return sessions.map((session) => ({
      sessionId: session.sessionId,
      createdAt: session.createdAt,
    }));
  } catch (error) {
    console.error("Error fetching sessions:", error);
    throw new Error("Failed to fetch sessions.");
  }
}

export {
  initialize,
  generate,
  saveChatSession,
  loadChatSession,
  getAllSessionIds,
  initializeWithMessages,
  generateSuggestions,
  getAllSessions,
  splitPhrase,
};
