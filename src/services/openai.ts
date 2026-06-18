import OpenAI from 'openai';
import { loadEnv } from '../utils/envConfig.js';

// Load environment variables
loadEnv();

let openaiClient: OpenAI | null = null;

export function getOpenAIClient(): OpenAI {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey || apiKey.trim() === '' || apiKey === 'your_openai_api_key_here') {
    throw new Error('OPENAI_API_KEY_MISSING');
  }
  if (!openaiClient) {
    const baseURL = process.env.OPENAI_BASE_URL || undefined;
    openaiClient = new OpenAI({
      apiKey,
      baseURL,
      timeout: 20000, // 20 seconds timeout
    });
  }
  return openaiClient;
}

export interface ChatMessageParam {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export async function getModels(): Promise<string[]> {
  const client = getOpenAIClient();
  try {
    const response = await client.models.list();
    return response.data.map(m => m.id);
  } catch (error) {
    console.error('Failed to fetch models:', error);
    return ['qwen3.7-max', 'gpt-4o', 'gpt-3.5-turbo']; // Provide fallback models on error
  }
}

// Streaming logic has been migrated to LangChain in src/services/langchain.ts and src/services/agent.ts
