import Replicate from "replicate";

const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN,
});

/**
 * Generate an image using Stable Diffusion model.
 * @param {string} prompt - The prompt to generate the image.
 * @param {number} width - The width of the image (default: 1024).
 * @param {number} height - The height of the image (default: 1024).
 * @returns {Promise<{ success: boolean, content: string }>} - A promise that resolves to an object containing a success flag and either the image URL or an error message.
 */
async function generateImage(
  prompt: string,
  width: number = 1024,
  height: number = 1024
): Promise<{ success: boolean; content: string }> {
  console.log(prompt);
  try {
    const output = await replicate.run("stability-ai/stable-diffusion-3", {
      input: {
        output_format: "png",
        width: width,
        height: height,
        prompt: prompt,
        num_outputs: 1,
        cfg: 4.5,
        output_quality: 79,
      },
    });

    if (Array.isArray(output) && output.length > 0) {
      return { success: true, content: output[0] as string };
    } else {
      return { success: false, content: "Unexpected output format from Replicate API" };
    }
  } catch (error) {
    console.error("Error generating image:", error);
    if (error instanceof Error) {
      if (error.message.includes("NSFW content detected")) {
        return { success: false, content: "NSFW content detected. Please try a different prompt." };
      }
    }
    return {
      success: false,
      content: "Failed to generate image. Please try again or use a different prompt.",
    };
  }
}

/**
 * Determine if the user is requesting image generation.
 * @param {string} userPrompt - The user's input prompt.
 * @returns {Promise<boolean>} - A promise that resolves to true if image generation is requested, false otherwise.
 */
async function isImageGenerationRequest(userPrompt: string): Promise<boolean> {
  const classificationPrompt = `
      Determine if the following user query is requesting image generation, visualization, or any form of visual representation.
      Consider both direct requests (e.g., "generate an image", "create a picture") and indirect requests (e.g., "can you imagine what it looked like?", "what might this appear as?", "visualize this for me").
      
      Respond with "YES" if the query implies any form of image creation or visualization request, and "NO" if it doesn't.
  
      Query: ${userPrompt}
      Answer (YES/NO):`;

  const output = await replicate.run("meta/meta-llama-3-70b-instruct", {
    input: { prompt: classificationPrompt },
  });

  const result = Array.isArray(output)
    ? output.join("").trim().toUpperCase()
    : String(output).trim().toUpperCase();
  return result.includes("YES");
}

export { generateImage, isImageGenerationRequest };
