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

const rawProjectModel = mongoose.model("Project", rawProjectSchema);

/**
 * Get a specified number of projects starting starting from the skip index
 *
 * @param limit - number of projects to get
 * @param offset - index to start from
 * @returns - array of projects
 */
async function getProjects(limit: number, offset: number) {
  const res = await rawProjectModel.find({}, null, { limit, skip: offset });
  return res;
}

/**
 * Get the total number of projects
 * @returns - number of projects
 */
async function getProjectCount() {
  const res = await rawProjectModel.countDocuments();
  return res;
}

export { getProjects, getProjectCount };
