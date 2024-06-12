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
  venue: [{
    venue_id: Number,
    venue_name: String,
  }],
});


const ProjectModel = mongoose.models.Project || mongoose.model<Project>("Project", projectSchema);
const SortedCleanProjectModel = mongoose.models.SortedCleanProject || mongoose.model<Project>("SortedCleanProject", projectSchema);

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
 * Get a specified number of projects starting starting from the skip index
 *
 * @param limit - number of projects to get
 * @param offset - index to start from
 * @returns - array of projects
 */
async function getCleanProjects(limit: number, offset: number) {
  const res = await SortedCleanProjectModel.find({}, null, { limit, skip: offset });
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

export { getCleanProjects, getCleanProjectCount, getProjects, getProjectCount };

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