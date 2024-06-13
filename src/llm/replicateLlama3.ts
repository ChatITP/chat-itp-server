import Replicate from "replicate";

const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN,
});

type MessageType = {
  content: string;
  role: string;
};

let messageMemory: MessageType[] = [];

/**
 * Initialize the AI with a system prompt.
 * @param systemPrompt - The initial system prompt
 * @todo Make this Restful and stateless
 */
async function initialize(systemPrompt: string) {
  messageMemory = [];
  messageMemory.push({ content: systemPrompt, role: "system" });
}

/**
 * Generate an AI response based on the user prompt.
 * @param userPrompt - The user prompt
 * @todo Make this Restful and stateless
 */
async function generate(userPrompt: string) {
  const systemPromptAndHistory = messageMemory
    .map((msg) => `<|start_header_id|>${msg.role}<|end_header_id|>\n\n${msg.content}<|eot_id|>`)
    .join("");

  const newUserPrompt = `<|start_header_id|>user<|end_header_id|>\n\n${userPrompt}<|eot_id|>`;

  const input = {
    prompt: `<|begin_of_text|>${systemPromptAndHistory}${newUserPrompt}<|start_header_id|>assistant<|end_header_id|>`,
  };

  const output = (await replicate.run("meta/meta-llama-3-70b-instruct", { input })) as string[];
  const aiResponse = output.join("");

  messageMemory.push({ content: userPrompt, role: "user" });
  messageMemory.push({ content: aiResponse, role: "assistant" });

  return aiResponse;
}

export { initialize, generate };
