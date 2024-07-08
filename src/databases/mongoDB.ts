import mongoose, { Schema } from "mongoose";
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

interface Message {
  content: string;
  role: string;
}

interface ChatSession extends Document {
  sessionId: string;
  messages: Message[];
  createdAt: Date;
}

const messageSchema = new Schema({
  content: String,
  role: String,
});

const chatSessionSchema = new Schema({
  sessionId: { type: String, required: true, unique: true },
  messages: [messageSchema],
  createdAt: { type: Date, default: Date.now },
});

const ChatSessionModel = mongoose.models.ChatSession || mongoose.model<ChatSession>("ChatSession", chatSessionSchema);

interface User {
  designated: number;
  user_name: string;
}

interface Class {
  class_id: number;
  class_name: string;
  course_id: string;
  instructor: string;
  instructor_id: string;
}

interface Document {
  document_id: number;
  document: string;
  document_name: string;
  document_type_id: string;
  main_image: number;
  document_type_name: string;
  document_type_extension: string;
  secret: number;
  alt_text: string;
}

interface Venue {
  venue_id: number;
  venue_name: string;
}

interface Project extends Document {
  users: User[];
  classes: Class[];
  instructors: string[];
  image: string;
  image_alt: string;
  documents: Document[];
  project_id: string;
  project_name: string;
  audience: string;
  elevator_pitch: string;
  description: string;
  background: string;
  user_scenario: string;
  technical_system: string;
  url: string;
  video: string;
  public_video_url: string;
  keywords: string;
  conclusion: string;
  project_references: string;
  thesis: string;
  timestamp: string;
  personal_statement: string;
  sustain: string;
  thesis_slides: string;
  thesis_tags: string;
  venue: Venue | Venue[];
}

export const projectSchema = new Schema({
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
  venue: [
    {
      venue_id: Number,
      venue_name: String,
    },
  ],
});

const promptSchema = new mongoose.Schema({
  title: String,
  type: String,
  system_prompt: String,
  main_prompt: String,
  created_at: { type: Date, default: Date.now },
});

promptSchema.index({ title: 1, type: 1 }, { unique: true });

const ProjectModel = mongoose.models.Project || mongoose.model<Project>("Project", projectSchema);
const SortedCleanProjectModel =
  mongoose.models.SortedCleanProject ||
  mongoose.model<Project>("SortedCleanProject", projectSchema);
const PromptModel = mongoose.models.Prompt || mongoose.model("Prompt", promptSchema);

/**
 * Get a specified number of projects starting starting from the skip index
 *
 * @param limit - number of projects to get
 * @param offset - index to start from
 * @returns - array of projects
 */
async function getProjects(limit: number, offset: number) {
  const res = await ProjectModel.find({}, null, { limit, skip: offset });
  return res;
}

/**
 * Get the total number of projects
 * @returns - number of projects
 */
async function getProjectCount() {
  const res = await ProjectModel.countDocuments();
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

/**
 * Get a specified number of projects starting starting from the skip index
 *
 * @param limit - number of projects to get
 * @param offset - index to start from
 * @returns - array of projects
 */
async function getCleanProjects(limit: number, offset: number, searchQuery: string | null = null) {
  const filter = searchQuery ? { project_name: { $regex: searchQuery, $options: 'i' } } : {};
  const res = await SortedCleanProjectModel.find(filter, null, { limit, skip: offset });
  return res;
}

/**
 * Get the total number of projects
 * @returns - number of projects
 */
async function getCleanProjectCount() {
  const res = await SortedCleanProjectModel.countDocuments();
  return res;
}

/**
 * Find a project by its project_id and update it with the given data.
 * @param projectId - the project_id of the project to update
 * @param updateData - the data to update the project with
 * @returns - the updated project
 */
async function findByIdAndUpdateCleanProject(projectId: string, updateData: any) {
  const updatedProject = await SortedCleanProjectModel.findOneAndUpdate(
    { project_id: projectId },
    updateData,
    { new: true }
  );
  return updatedProject;
}

export {
  ChatSessionModel, 
  getCleanProjects,
  getCleanProjectCount,
  findByIdAndUpdateCleanProject,
  getProjects,
  getProjectCount,
  getPrompts,
  getPromptByTitleAndType,
  getPromptByTitleTypeAndNotId,
  createPrompt,
  updatePrompt,
  deletePrompt,
};

// script to clean up data
// const projectModel = mongoose.model<Project>("Project_nd", projectSchema);
// function cleanString(str: string): string {
//   return str
//     .replace(/&lt;/g, "<")
//     .replace(/&gt;/g, ">")
//     .replace(/&amp;/g, "&")
//     .replace(/&quot;/g, "\"")
//     .replace(/&#039;/g, "'")
//     .replace(/\\n/g, "\n")
//     .replace(/\\r/g, "\r")
//     .replace(/\\t/g, "\t")
//     .replace(/\\&quot;/g, "\"")
//     .replace(/\\'/g, "'")
//     .replace(/\\&/g, "&")
//     .replace(/<br\s*\/?>/gi, "\n")
//     .replace(/\\"/g, "\"");
// }

// function cleanDocument(doc: any): any {
//   if (Array.isArray(doc)) {
//     return doc.map(cleanDocument);
//   } else if (typeof doc === "object" && doc !== null) {
//     const cleanedDoc: any = {};
//     for (const key in doc) {
//       if (key === "_id") {
//         cleanedDoc[key] = doc[key];
//       } else if (typeof doc[key] === "string") {
//         cleanedDoc[key] = cleanString(doc[key]);
//       } else {
//         cleanedDoc[key] = cleanDocument(doc[key]);
//       }
//     }
//     return cleanedDoc;
//   }
//   return doc;
// }

// async function migrateAndCleanData() {
//   const allProjects = await rawProjectModel.find({});

//   for (const project of allProjects) {
//     const projectObj = project.toObject();
//     const cleanedProject = cleanDocument(projectObj);
//     const newProject = new cleanProjectModel(cleanedProject);
//     await newProject.save();
//   }

//   console.log("Data migration and cleaning complete.");
// }

// migrateAndCleanData().catch((error) => {
//   console.error("Data migration and cleaning failed:", error);
// });
