/**
 * LiteLLM Service
 * Handles communication with LiteLLM proxy for AI model interactions
 */

import axios, { AxiosError } from 'axios';
import { configService } from './config.service';
import {
  LiteLLMMessage,
  LiteLLMRequest,
  LiteLLMModelsResponse,
  LiteLLMChatResponse,
  ModelsListResponse,
  ChatCompletionResponse,
} from '../types/litellm.types';

class LiteLLMService {
  /**
   * Build the correct URL to avoid double slash issues
   */
  private buildUrl(basePath: string, path: string): string {
    // Remove trailing slash from base URL
    const cleanBasePath = basePath.endsWith('/') ? basePath.slice(0, -1) : basePath;

    // Ensure path starts with slash
    const cleanPath = path.startsWith('/') ? path : `/${path}`;

    return `${cleanBasePath}${cleanPath}`;
  }

  /**
   * Get list of available models from LiteLLM
   */
  async getModelsList(): Promise<ModelsListResponse> {
    try {
      const baseUrl = await configService.getValueByKey('LITELLM_API_BASE');
      const litellmApiKey = await configService.getValueByKey('LITELLM_API_KEY');
      const openaiApiKey = await configService.getValueByKey('OPENAI_API_KEY');

      if (!baseUrl) {
        console.error('❌ LiteLLM API base URL not configured');
        return { success: false, error: 'LiteLLM API base URL not configured', models: [] };
      }

      // Choose the right API key based on the base URL
      const isDirectOpenAI = baseUrl.includes('api.openai.com');
      const apiKey = isDirectOpenAI ? openaiApiKey : litellmApiKey;

      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };

      if (apiKey) {
        headers['Authorization'] = `Bearer ${apiKey}`;
      }

      const url = this.buildUrl(baseUrl, '/v1/models');
      console.log(`📡 Requesting LiteLLM model list: ${url}`);

      const response = await axios.get<LiteLLMModelsResponse>(url, { 
        headers,
        timeout: 10000, // 10 second timeout
      });

      console.log(`✅ Retrieved ${response.data.data?.length || 0} models from LiteLLM`);
      return {
        success: true,
        models: response.data.data || [],
      };
    } catch (error) {
      const axiosError = error as AxiosError;
      console.error('❌ Failed to get model list:', axiosError.message);
      
      if (axiosError.response) {
        console.error('Response status:', axiosError.response.status);
        console.error('Response data:', axiosError.response.data);
      } else if (axiosError.code === 'ECONNREFUSED') {
        return {
          success: false,
          error: 'Cannot connect to LiteLLM service. Please ensure LiteLLM is running.',
          models: [],
        };
      }

      return {
        success: false,
        error: `Failed to get model list: ${axiosError.message}`,
        models: [],
      };
    }
  }

  /**
   * Send chat completion request to LiteLLM
   */
  async sendChatCompletion(
    messages: LiteLLMMessage[],
    modelId?: string,
    temperature?: number,
    maxTokens?: number,
    topP?: number,
    presencePenalty?: number,
    frequencyPenalty?: number
  ): Promise<ChatCompletionResponse> {
    try {
      // Priority: Environment variables > Database config
      const baseUrl = process.env.LITELLM_API_BASE || await configService.getValueByKey('LITELLM_API_BASE');
      const litellmApiKey = process.env.LITELLM_API_KEY || await configService.getValueByKey('LITELLM_API_KEY');
      const openaiApiKey = process.env.OPENAI_API_KEY || await configService.getValueByKey('OPENAI_API_KEY');

      if (!baseUrl) {
        console.error('❌ LiteLLM API base URL not configured');
        return { success: false, error: 'LiteLLM API base URL not configured' };
      }

      // Model ID must be provided from frontend - no default fallback
      if (!modelId) {
        console.error('❌ No model ID provided in request');
        return { success: false, error: 'Model ID is required. Please select a model in the frontend.' };
      }

      console.log(`🔗 Using LiteLLM endpoint: ${baseUrl}`);

      // Choose the right API key based on the base URL
      // If connecting directly to OpenAI, use OpenAI key; otherwise use LiteLLM key
      const isDirectOpenAI = baseUrl.includes('api.openai.com');
      const apiKey = isDirectOpenAI ? openaiApiKey : litellmApiKey;

      if (!apiKey) {
        console.warn(`⚠️  No API key configured for ${isDirectOpenAI ? 'OpenAI' : 'LiteLLM'}`);
        console.warn(`⚠️  Attempting request without authentication (may work for public proxies)`);
      } else {
        console.log(`🔑 Using API key: ${apiKey.substring(0, 10)}...`);
      }

      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };

      if (apiKey) {
        headers['Authorization'] = `Bearer ${apiKey}`;
      }

      const url = this.buildUrl(baseUrl, '/v1/chat/completions');
      console.log(`💬 Sending chat request to: ${url}`);

      const requestData: LiteLLMRequest = {
        model: modelId, // Use model from frontend - no fallback
        messages: messages,
        temperature: temperature !== undefined ? temperature : 0.7,
        max_tokens: maxTokens || 1000,
      };

      // Only add OpenAI-specific parameters for GPT models
      // Claude, Gemini, DeepSeek, Nova, Llama, Mistral don't support these
      const modelLower = modelId.toLowerCase();
      const isGPTModel = (
        modelLower.startsWith('gpt-') || 
        modelLower.startsWith('o1-') ||
        modelLower.startsWith('o3-') ||
        modelLower.startsWith('o4-')
      );
      
      if (isGPTModel) {
        requestData.top_p = topP !== undefined ? topP : 1.0;
        requestData.presence_penalty = presencePenalty !== undefined ? presencePenalty : 0.0;
        requestData.frequency_penalty = frequencyPenalty !== undefined ? frequencyPenalty : 0.0;
      }

      console.log(`🤖 Using model: ${requestData.model} (temp: ${requestData.temperature})`);
      console.log(`📝 Message count: ${messages.length}`);

      const response = await axios.post<LiteLLMChatResponse>(url, requestData, {
        headers,
        timeout: 60000, // 60 second timeout for chat
      });

      // Validate response format
      if (!response.data || !response.data.choices || response.data.choices.length === 0) {
        console.error('❌ Invalid AI response format:', response.data);
        return { success: false, error: 'Invalid AI response format' };
      }

      const aiMessage = response.data.choices[0].message.content;
      console.log(`✅ Received AI response (${aiMessage.length} characters)`);

      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      const axiosError = error as AxiosError;
      console.error(`❌ Chat completion request failed: ${axiosError.message}`);

      if (axiosError.response) {
        console.error('Response status:', axiosError.response.status);
        console.error('Response data:', axiosError.response.data);
      } else if (axiosError.code === 'ECONNREFUSED') {
        return {
          success: false,
          error: 'Cannot connect to LiteLLM service. Please ensure LiteLLM is running.',
        };
      } else if (axiosError.code === 'ETIMEDOUT') {
        return {
          success: false,
          error: 'Request timed out. The AI service took too long to respond.',
        };
      }

      return {
        success: false,
        error: `Chat completion request failed: ${axiosError.message}`,
      };
    }
  }

  /**
   * Get provider name from model ID
   */
  getProviderFromModelId(modelId: string): string {
    if (modelId.startsWith('gpt')) return 'openai';
    if (modelId.startsWith('claude')) return 'anthropic';
    if (modelId.startsWith('gemini')) return 'google';
    if (modelId.startsWith('llama')) return 'meta';
    if (modelId.includes('mistral')) return 'mistral';
    return 'unknown';
  }

  /**
   * Test LiteLLM connection
   */
  async testConnection(): Promise<{ success: boolean; message: string; models?: number }> {
    try {
      const result = await this.getModelsList();
      if (result.success) {
        return {
          success: true,
          message: 'Successfully connected to LiteLLM service',
          models: result.models.length,
        };
      } else {
        return {
          success: false,
          message: result.error || 'Failed to connect to LiteLLM service',
        };
      }
    } catch (error) {
      return {
        success: false,
        message: `Connection test failed: ${(error as Error).message}`,
      };
    }
  }
}

// Export singleton instance
export const liteLLMService = new LiteLLMService();

