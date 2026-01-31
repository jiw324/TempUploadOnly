export interface Message {
  id: string;
  text: string;
  sender: 'user' | 'ai';
  timestamp: Date;
}

export interface AIModel {
  id: string;
  name: string;
  greeting: string;
  description: string;
  personality?: string;
  icon?: string;
}

export interface AISettings {
  personality: string;
  responseSpeed: string;
  creativity: number;
  helpfulness: number;
  verbosity: number;
  temperature: number;
  maxTokens: number;
  systemPrompt: string;
  taskPrompt: string;
  modelId?: string;
  topP?: number;
  presencePenalty?: number;
  frequencyPenalty?: number;
}

export interface Conversation {
  id: string;
  title: string;
  aiModel: AIModel;
  messages: Message[];
  createdAt: Date;
  lastMessageAt: Date;
}

export interface AuthRequest {
  researchKey: string;
}

export interface AuthResponse {
  success: boolean;
  token?: string;
  message: string;
}

export interface ChatRequest {
  message: string;
  conversationId: string;
  aiModel: AIModel;
  settings?: AISettings;
  messageHistory?: Message[];
}

export interface ChatResponse {
  success: boolean;
  response?: Message;
  error?: string;
}

export interface User {
  id: string;
  isAuthenticated: boolean;
}

