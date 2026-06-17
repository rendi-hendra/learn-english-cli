import OpenAI from 'openai';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

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

export async function* streamChatCompletion(
  messages: ChatMessageParam[],
  model: string = 'qwen3.7-max',
  enableThinking: boolean = false
): AsyncGenerator<string, void, unknown> {
  // First, check API key
  const client = getOpenAIClient();

  try {
    const requestParams: any = {
      model,
      messages: messages.map(m => ({ role: m.role, content: m.content })),
      stream: true,
    };

    if (!enableThinking) {
      requestParams.enable_thinking = false;
      requestParams.think = false;
      requestParams.thinking = { enabled: false };
    } else {
      requestParams.enable_thinking = true;
      requestParams.think = true;
      // Many APIs (like SiliconFlow/OpenRouter) use thinking budget or true flags
      requestParams.thinking = { enabled: true };
    }

    const stream = await client.chat.completions.create(requestParams as any) as any;

    let hasContent = false;
    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content || '';
      if (content) {
        hasContent = true;
        yield content;
      }
    }

    if (!hasContent) {
      throw new Error('RESPONSE_EMPTY');
    }
  } catch (error: any) {
    // Handle specific error codes
    if (error.message === 'RESPONSE_EMPTY') {
      throw new Error('API mengembalikan respon kosong.');
    }
    
    // Check OpenAI API specific error properties or status codes
    if (error.status === 401) {
      throw new Error('API Key tidak valid atau salah. Silakan periksa file .env.');
    } else if (error.status === 429) {
      throw new Error('Rate limit terlampaui (HTTP 429). Silakan tunggu beberapa saat.');
    } else if (error.status === 404) {
      throw new Error(`Model '${model}' tidak ditemukan.`);
    } else if (error.code === 'ENOTFOUND' || error.message?.includes('fetch failed') || error.message?.includes('network')) {
      throw new Error('Internet putus atau tidak ada koneksi ke API OpenAI.');
    } else if (error.name === 'APITimeoutError' || error.message?.includes('timeout')) {
      throw new Error('Timeout: Permintaan ke OpenAI memakan waktu terlalu lama.');
    }
    
    throw new Error(error.message || 'Terjadi kesalahan saat menghubungi API OpenAI.');
  }
}
