import { ChatOpenAI } from "@langchain/openai";
import { StringOutputParser } from "@langchain/core/output_parsers";
import { loadEnv } from "../utils/envConfig.js";
import {
  TRANSLATOR_SYSTEM_PROMPT,
  TRANSLATOR_SYSTEM_PROMPT_THINKING,
  ROUTER_SYSTEM_PROMPT,
  AGENT_SYSTEM_PROMPT,
} from "../config/prompts.js";
import {
  HumanMessage,
  AIMessage,
  SystemMessage,
  BaseMessage,
} from "@langchain/core/messages";

export interface MessageBuilderConfig {
  mode: "translator" | "chat" | "agent" | "router";
  enableThinking: boolean;
  messages: { role: string; content: string }[];
}

export class MessageBuilder {
  static build(config: MessageBuilderConfig): BaseMessage[] {
    const lcMessages: BaseMessage[] = [];

    // 1. Determine System Prompt based on mode
    let systemPrompt: string | null = null;
    if (config.mode === "translator") {
      systemPrompt = config.enableThinking
        ? TRANSLATOR_SYSTEM_PROMPT_THINKING
        : TRANSLATOR_SYSTEM_PROMPT;
    } else if (config.mode === "router") {
      systemPrompt = ROUTER_SYSTEM_PROMPT;
    } else if (config.mode === "agent") {
      systemPrompt = AGENT_SYSTEM_PROMPT;
    }

    // Validation: Ensure system prompt is present for modes that require it
    if (config.mode !== "chat") {
      if (!systemPrompt || systemPrompt.trim() === "") {
        throw new Error(`MessageBuilder: Missing or empty system prompt for mode '${config.mode}'`);
      }
    }

    // Inject System Prompt if it exists
    if (systemPrompt) {
      lcMessages.push(new SystemMessage(systemPrompt));
    }

    // 2. Inject User/Assistant/System messages
    for (const msg of config.messages) {
      if (!msg.content) continue;

      // Prevent duplicating system prompts if history somehow contains one
      if (msg.role === "system") {
        lcMessages.push(new SystemMessage(msg.content));
      } else if (msg.role === "assistant") {
        lcMessages.push(new AIMessage(msg.content));
      } else {
        lcMessages.push(new HumanMessage(msg.content));
      }
    }

    // 3. Validation
    if (lcMessages.length === 0) {
      throw new Error("MessageBuilder: No messages provided to build.");
    }

    return lcMessages;
  }
}

loadEnv();

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
      throw new Error("INVALID_MODEL_NAME: Model name must be a valid string.");
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
      throw new Error("OPENAI_API_KEY_MISSING");
    }

    const baseURL = process.env.OPENAI_BASE_URL || undefined;

    const modelKwargs: Record<string, any> = {};
    if (enableThinking) {
      modelKwargs.enable_thinking = true;
      modelKwargs.think = true;
      modelKwargs.thinking = { enabled: true };
    } else {
      modelKwargs.enable_thinking = false;
      modelKwargs.think = false;
      modelKwargs.thinking = { enabled: false };
    }

    try {
      const model = new ChatOpenAI({
        openAIApiKey: apiKey,
        configuration: {
          baseURL,
        },
        modelName: modelName,
        streaming: true,
        modelKwargs,
      });

      // Cache the initialized model
      this.cache.set(cacheKey, model);
      return model;
    } catch (error: any) {
      // Error boundary for model creation failures
      throw new Error(`MODEL_INITIALIZATION_FAILED: ${error.message}`);
    }
  }

  public clearCache(): void {
    this.cache.clear();
  }
}

// Preserve existing API signature for backward compatibility
export function getLangChainModel(
  modelName: string,
  enableThinking: boolean,
): ChatOpenAI {
  return ModelManager.getInstance().getModel(modelName, enableThinking);
}

export async function routeUserCommand(
  userMessage: string,
  modelName: string,
): Promise<string> {
  const llm = getLangChainModel(modelName, false); // No need for thinking mode for simple routing
  const lcMessages = MessageBuilder.build({
    mode: "router",
    enableThinking: false,
    messages: [{ role: "user", content: userMessage }],
  });
  const response = await llm.invoke(lcMessages);
  return typeof response.content === "string" ? response.content.trim() : "";
}

export async function* streamLangChainChat(
  messages: { role: string; content: string }[],
  modelName: string,
  enableThinking: boolean,
  mode: "translator" | "chat",
): AsyncGenerator<string, void, unknown> {
  const llm = getLangChainModel(modelName, enableThinking);
  const parser = new StringOutputParser();

  const lcMessages = MessageBuilder.build({
    mode,
    enableThinking,
    messages,
  });

  const stream = await llm.pipe(parser).stream(lcMessages);

  for await (const chunk of stream) {
    yield chunk;
  }
}

import { createReactAgent } from "@langchain/langgraph/prebuilt";
import { getFsTools } from "../tools/index.js";

export async function* streamLangChainAgent(
  messages: { role: string; content: string }[],
  modelName: string,
  enableThinking: boolean,
): AsyncGenerator<string, void, unknown> {
  const llm = getLangChainModel(modelName, enableThinking);
  const tools = await getFsTools();

  const agent = createReactAgent({
    llm,
    tools,
  });

  const lcMessages = MessageBuilder.build({
    mode: "agent",
    enableThinking,
    messages,
  });

  const eventStream = await agent.streamEvents(
    { messages: lcMessages },
    { version: "v2" },
  );

  for await (const event of eventStream) {
    if (event.event === "on_chat_model_stream") {
      const chunk = event.data?.chunk;
      if (!chunk) continue;

      // Content bisa berupa string langsung
      if (typeof chunk.content === "string" && chunk.content) {
        yield chunk.content;
      }
      // Content bisa berupa array of blocks (misal: [{ type: "text", text: "..." }])
      else if (Array.isArray(chunk.content)) {
        for (const block of chunk.content) {
          if (block.type === "text" && block.text) {
            yield block.text;
          }
        }
      }
      // Beberapa model mengirim text langsung di chunk.text
      else if (typeof chunk.text === "string" && chunk.text) {
        yield chunk.text;
      }
    } else if (event.event === "on_tool_start") {
      yield `\n\n> 🤖 **Mengeksekusi tool:** \`${event.name}\`...\n\n`;
    } else if (event.event === "on_tool_end") {
      yield `\n\n> ✅ **Tool selesai**\n\n`;
    }
  }
}
