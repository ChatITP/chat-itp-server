import { Redis } from "ioredis";
const redis = new Redis(); // default: localhost:6379

type ConversationState = {
  discussedProjects: Set<string>;
  keyTopics: string[];
  interactionCount: number;
  systemPrompt: string;
};

export type MessageType = {
  content: string;
  role: string;
  type?: 'text' | 'image'; 
  imageUrl?: string; 
};

export async function initialize(userId: string, systemPrompt: string) {
  const initialMessages: MessageType[] = [{ content: systemPrompt, role: "system" }];
  await redis.set(`session:${userId}:messages`, JSON.stringify(initialMessages));
  const initialState: ConversationState = {
    discussedProjects: new Set<string>(),
    keyTopics: [],
    interactionCount: 0,
    systemPrompt: systemPrompt,
  };
  await saveState(userId, initialState);
}

export async function getMessageMemory(userId: string): Promise<MessageType[]> {
  const messages = await redis.get(`session:${userId}:messages`);
  return messages ? JSON.parse(messages) : [];
}

export async function addMessage(userId: string, content: string, role: string, type: 'text' | 'image' = 'text', imageUrl?: string) {
  const messages = await getMessageMemory(userId);
  messages.push({ content, role, type, imageUrl });
  await redis.set(`session:${userId}:messages`, JSON.stringify(messages));
}

export async function clearMessageMemory(userId: string) {
  await redis.del(`session:${userId}:messages`);
}

export async function getState(userId: string): Promise<ConversationState> {
  const state = await redis.get(`session:${userId}:state`);
  if (state) {
    const parsedState = JSON.parse(state);
    return {
      ...parsedState,
      discussedProjects: new Set<string>(parsedState.discussedProjects),
    };
  } else {
    return {
      discussedProjects: new Set<string>(),
      keyTopics: [],
      interactionCount: 0,
      systemPrompt: "",
    };
  }
}


export async function saveState(userId: string, state: ConversationState): Promise<void> {
  const stateToSave = {
    ...state,
    discussedProjects: Array.from(state.discussedProjects),
  };
  await redis.set(`session:${userId}:state`, JSON.stringify(stateToSave));
}

export async function saveMessageMemory(userId: string, messages: MessageType[]): Promise<void> {
  await redis.set(`session:${userId}:messages`, JSON.stringify(messages));
}

export async function clearSession(userId: string): Promise<void> {
  await redis.del(`session:${userId}:state`);
  await redis.del(`session:${userId}:messages`);
}
