import mongoose, { Schema, Document } from "mongoose";

interface Message {
  content: string;
  role: string;
}

interface ChatSession extends Document {
  sessionId: string;
  messages: Message[];
  createdAt: Date;
}

const chatSessionSchema = new Schema({
  sessionId: String,
  messages: [{ content: String, role: String }],
  state: {
    discussedProjects: [String],
    keyTopics: [String],
    interactionCount: Number
  }
}, { timestamps: { createdAt: 'createdAt' } });

const ChatSessionModel = mongoose.models.ChatSession || mongoose.model<ChatSession>("ChatSession", chatSessionSchema);

export { ChatSessionModel };