/**
 * Configuration Types
 * TypeScript interfaces for system configuration
 */

export interface ConfigRow {
  config_id: number;
  key: string;
  value: string | null;
  description: string | null;
  created_at: Date;
  updated_at: Date;
}

export interface ConfigUpdateDTO {
  key: string;
  value: string;
  description?: string;
}

export interface LiteLLMConfig {
  apiBaseUrl: string;
  apiKey?: string;
  openaiKey?: string;
  anthropicKey?: string;
  googleKey?: string;
  mistralKey?: string;
  cohereKey?: string;
  replicateKey?: string;
  huggingfaceKey?: string;
  autoUpdateModels: boolean;
  defaultModel: string;
}

