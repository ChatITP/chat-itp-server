export type MessageType = {
    content: string;
    role: string;
  };
  
  let messageMemory: MessageType[] = [];
  
  export function initialize(systemPrompt: string) {
    messageMemory = [];
    messageMemory.push({ content: systemPrompt, role: "system" });
  }
  
  export function getMessageMemory() {
    return messageMemory;
  }
  
  export function addMessage(content: string, role: string) {
    messageMemory.push({ content, role });
  }
  
  export function clearMessageMemory() {
    messageMemory = [];
  }