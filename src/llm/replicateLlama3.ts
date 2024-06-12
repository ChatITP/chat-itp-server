import { BufferMemory } from "langchain/memory";
import Replicate from "replicate";

const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN,
});

const memory = new BufferMemory({ returnMessages: true });
let initialSystemPrompt = "";

/**
 * Initialize the AI with a system prompt.
 * @param systemPrompt - The initial system prompt
 * @todo Make this Restful and stateless
 */
async function initialize(systemPrompt: string) {
  memory.clear();
  await memory.saveContext({ input: "initialization" }, { output: systemPrompt });
  initialSystemPrompt = systemPrompt;
}

/**
 * Generate an AI response based on the user prompt.
 * @param userPrompt - The user prompt
 * @todo Make this Restful and stateless
 */
async function generate(userPrompt: string) {
  const pastMessages = await memory.loadMemoryVariables({});
  type MessageType = {
    content: string;
  };

  const input = {
    prompt: `${initialSystemPrompt}\n\n${(pastMessages.history as MessageType[])
      .map((msg) => msg.content)
      .join("\n")}\nuser: ${userPrompt}`,
  };

  const output = await replicate.run("meta/meta-llama-3-70b-instruct", { input });
  const aiResponse = Array.isArray(output) ? output.join("") : output;
  await memory.saveContext({ input: userPrompt }, { output: aiResponse });
}

export { initialize, generate };
