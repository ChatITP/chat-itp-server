import mongoose, { Schema } from "mongoose";

const promptSchema = new Schema({
  title: String,
  type: String,
  system_prompt: String,
  main_prompt: String,
  created_at: { type: Date, default: Date.now },
});

promptSchema.index({ title: 1, type: 1 }, { unique: true });

const PromptModel = mongoose.models.Prompt || mongoose.model("Prompt", promptSchema);

/**
 * Get all prompts
 * @returns - array of prompts
 */
async function get() {
  const prompts = await PromptModel.find().sort({ created_at: -1 });
  return prompts;
}

/**
 * Get a single prompt by title and type
 * @param title - title of the prompt
 * @param type - type of the prompt
 * @returns - the prompt or null if not found
 */
async function getByTitleAndType(title: string, type: string) {
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
async function getByTitleTypeAndNotId(title: string, type: string, id: string) {
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
async function create(title: string, type: string, system_prompt: string, main_prompt: string) {
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
async function update(
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
async function remove(id: string) {
  const prompt = await PromptModel.findByIdAndDelete(id);
  return prompt;
}

export { get, getByTitleAndType, getByTitleTypeAndNotId, create, update, remove };

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
