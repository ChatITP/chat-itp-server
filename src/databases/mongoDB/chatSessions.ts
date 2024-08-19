import mongoose, { Schema, Document } from "mongoose";

interface Message {
  content: string;
  role: string;
}

interface ChatSession extends Document {
  sessionId: string;
  userId: string;
  messages: Message[];
  state: {
    discussedProjects: string[];
    keyTopics: string[];
    interactionCount: number;
    systemPrompt: string;
  };
  createdAt: Date;
}

const chatSessionSchema = new Schema({
  sessionId: { type: String, required: true },
  userId: { type: String, required: true },
  messages: [{ content: String, role: String }],
  state: {
    discussedProjects: [String],
    keyTopics: [String],
    interactionCount: Number,
    systemPrompt: String,
  }
}, { timestamps: { createdAt: 'createdAt' } });

const ChatSessionModel = mongoose.models.ChatSession || mongoose.model<ChatSession>("ChatSession", chatSessionSchema);

export { ChatSessionModel };
