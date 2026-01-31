/**
 * LiteLLM Types
 * TypeScript interfaces for LiteLLM service
 */

export interface LiteLLMMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface LiteLLMRequest {
  model: string;
  messages: LiteLLMMessage[];
  max_tokens?: number;
  temperature?: number;
  top_p?: number;
  presence_penalty?: number;
  frequency_penalty?: number;
}

export interface ModelInfo {
  id: string;
  object: string;
  created?: number;
  owned_by?: string;
}

export interface LiteLLMModelsResponse {
  object: string;
  data: ModelInfo[];
}

export interface LiteLLMChatChoice {
  index: number;
  message: {
    role: string;
    content: string;
  };
  finish_reason: string;
}

export interface LiteLLMChatResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: LiteLLMChatChoice[];
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

export interface ModelsListResponse {
  success: boolean;
  models: ModelInfo[];
  error?: string;
}

export interface ChatCompletionResponse {
  success: boolean;
  data?: LiteLLMChatResponse;
  error?: string;
}

