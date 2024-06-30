import mongoose from "mongoose";
import "dotenv/config";

import * as projects from "./projects";
import * as prompts from "./prompts";
import * as users from "./users";
import * as earlyAccessCodes from "./earlyAccessCode";
import * as refreshTokens from "./refreshToken";

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

export { projects, prompts, users, earlyAccessCodes, refreshTokens };
