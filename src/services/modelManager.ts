import { ChatOpenAI } from "@langchain/openai";
import { loadEnv } from "../utils/envConfig.js";
import { AppError, ErrorCode } from "../utils/errors.js";

loadEnv();

/**
 * Singleton ModelManager with instance caching by (modelName, enableThinking) tuple.
 * Prevents redundant ChatOpenAI initialization across routing, streaming, and agent calls.
 */
class ModelManager {
  private static instance: ModelManager;
  private cache: Map<string, ChatOpenAI>;

  private constructor() {
    this.cache = new Map();
  }

  public static getInstance(): ModelManager {
    if (!ModelManager.instance) {
      ModelManager.instance = new ModelManager();
    }
    return ModelManager.instance;
  }

  public getModel(modelName: string, enableThinking: boolean): ChatOpenAI {
    // Validate input parameters
    if (
      !modelName ||
      typeof modelName !== "string" ||
      modelName.trim() === ""
    ) {
      throw new AppError(
        ErrorCode.INVALID_MODEL,
        "Model name must be a valid string."
      );
    }

    const cacheKey = `${modelName}_${enableThinking}`;

    // Return cached instance if available
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey)!;
    }

    // Validate environment variables
    const apiKey = process.env.OPENAI_API_KEY;
    if (
      !apiKey ||
      apiKey.trim() === "" ||
      apiKey === "your_openai_api_key_here"
    ) {
      throw new AppError(
        ErrorCode.API_KEY_MISSING,
        "OpenAI API Key is missing. Please set OPENAI_API_KEY in your .env file."
      );
    }

    const baseURL = process.env.OPENAI_BASE_URL || undefined;

    const modelKwargs: Record<string, any> = {
      enable_thinking: enableThinking,
      think: enableThinking,
      thinking: { enabled: enableThinking },
    };

    try {
      const model = new ChatOpenAI({
        openAIApiKey: apiKey,
        configuration: { baseURL },
        modelName,
        streaming: true,
        modelKwargs,
      });

      this.cache.set(cacheKey, model);
      return model;
    } catch (error: any) {
      throw new AppError(
        ErrorCode.INVALID_MODEL,
        `Model initialization failed: ${error.message}`,
        { originalError: error }
      );
    }
  }

  public clearCache(): void {
    this.cache.clear();
  }
}

/**
 * Public helper — preserves existing API signature for backward compatibility.
 */
export function getLangChainModel(
  modelName: string,
  enableThinking: boolean,
): ChatOpenAI {
  return ModelManager.getInstance().getModel(modelName, enableThinking);
}
