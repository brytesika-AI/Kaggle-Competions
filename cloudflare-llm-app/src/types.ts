export interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
}

export interface AIModel {
  id: string;
  name: string;
  description: string;
  type: 'Text Generation' | 'Code' | 'Vision' | 'Translation';
}

export interface ChatSession {
  id: string;
  name: string;
  modelId: string;
  messages: Message[];
  systemPrompt: string;
  temperature: number;
}
