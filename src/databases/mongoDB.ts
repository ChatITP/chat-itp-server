import mongoose from "mongoose";
import "dotenv/config";

if (!process.env.MONGO_URI) {
  console.error("MongoDB URI not set.");
  process.exit(1);
}

async function connect() {
  try {
    await mongoose.connect(process.env.MONGO_URI as string);
  } catch (e) {
    console.error("MongoDB connection failed:", e);
  }
}

connect();

const rawProjectSchema = new mongoose.Schema({
  users: [{ designated: Number, user_name: String }],
  classes: [
    {
      class_id: Number,
      class_name: String,
      course_id: String,
      instructor: String,
      instructor_id: String,
    },
  ],
  instructors: [String],
  image: String,
  image_alt: String,
  documents: [
    {
      document_id: Number,
      document: String,
      document_name: String,
      document_type_id: String,
      main_image: Number,
      document_type_name: String,
      document_type_extension: String,
      secret: Number,
      alt_text: String,
    },
  ],
  project_id: String,
  project_name: String,
  audience: String,
  elevator_pitch: String,
  description: String,
  background: String,
  user_scenario: String,
  technical_system: String,
  url: String,
  video: String,
  public_video_url: String,
  keywords: String,
  conclusion: String,
  project_references: String,
  thesis: String,
  timestamp: String,
  personal_statement: String,
  sustain: String,
  thesis_slides: String,
  thesis_tags: String,
});

const promptSchema = new mongoose.Schema({
  title: String,
  type: String,
  system_prompt: String,
  main_prompt: String,
  created_at: { type: Date, default: Date.now },
});
promptSchema.index({ title: 1, type: 1 }, { unique: true });

const RawProjectModel = mongoose.model("Project", rawProjectSchema);
const PromptModel = mongoose.model("Prompt", promptSchema);

/**
 * Get a specified number of projects starting starting from the skip index
 *
 * @param limit - number of projects to get
 * @param offset - index to start from
 * @returns - array of projects
 */
async function getProjects(limit: number, offset: number) {
  const res = await RawProjectModel.find({}, null, { limit, skip: offset });
  return res;
}

/**
 * Get the total number of projects
 * @returns - number of projects
 */
async function getProjectCount() {
  const res = await RawProjectModel.countDocuments();
  return res;
}

/**
 * Get all prompts
 * @returns - array of prompts
 */
async function getPrompts() {
  const prompts = await PromptModel.find().sort({ created_at: -1 });
  return prompts;
}

/**
 * Get a single prompt by title and type
 * @param title - title of the prompt
 * @param type - type of the prompt
 * @returns - the prompt or null if not found
 */
async function getPromptByTitleAndType(title: string, type: string) {
  const prompt = await PromptModel.findOne({ title, type });
  return prompt;
}

/**
 * Get a single prompt by title and type, that does not have a specified id
 * @param title - title of the prompt
 * @param type - type of the prompt
 * @param id - id to exclude
 * @returns - the prompt or null if not found
 */
async function getPromptByTitleTypeAndNotId(title: string, type: string, id: string) {
  const prompt = PromptModel.findOne({ title, type, _id: { $ne: id } });
  return prompt;
}

/**
 * Create a new prompt
 * @param title - title of the prompt
 * @param type - type of the prompt
 * @param system_prompt - system prompt
 * @param main_prompt - main prompt
 * @returns - the new prompt
 */
async function createPrompt(
  title: string,
  type: string,
  system_prompt: string,
  main_prompt: string
) {
  const newPrompt = new PromptModel({ title, type, system_prompt, main_prompt });
  await newPrompt.save();
  return newPrompt;
}

/**
 * Update a prompt
 * @param id - id of the prompt
 * @param title - title of the prompt
 * @param type - type of the prompt
 * @param system_prompt - system prompt
 * @param main_prompt - main prompt
 * @returns - the updated prompt
 *
 */
async function updatePrompt(
  id: string,
  title: string,
  type: string,
  system_prompt: string,
  main_prompt: string
) {
  const prompt = await PromptModel.findByIdAndUpdate(
    id,
    { title, type, system_prompt, main_prompt },
    { new: true }
  );
  return prompt;
}

/**
 * Delete a prompt
 * @param id - id of the prompt
 * @returns - the deleted prompt
 */
async function deletePrompt(id: string) {
  const prompt = await PromptModel.findByIdAndDelete(id);
  return prompt;
}

export {
  getProjects,
  getProjectCount,
  getPrompts,
  getPromptByTitleAndType,
  getPromptByTitleTypeAndNotId,
  createPrompt,
  updatePrompt,
  deletePrompt,
};
