import { ChatOpenAI } from "@langchain/openai";
import { StringOutputParser } from "@langchain/core/output_parsers";
import { loadEnv } from "../utils/envConfig.js";
import { TRANSLATOR_SYSTEM_PROMPT, ROUTER_SYSTEM_PROMPT } from "../config/prompts.js";
import { HumanMessage, AIMessage, SystemMessage } from "@langchain/core/messages";

loadEnv();

export function getLangChainModel(modelName: string, enableThinking: boolean) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (
    !apiKey ||
    apiKey.trim() === "" ||
    apiKey === "your_openai_api_key_here"
  ) {
    throw new Error("OPENAI_API_KEY_MISSING");
  }

  const baseURL = process.env.OPENAI_BASE_URL || undefined;

  const modelKwargs: any = {};
  if (enableThinking) {
    modelKwargs.enable_thinking = true;
    modelKwargs.think = true;
    modelKwargs.thinking = { enabled: true };
  } else {
    modelKwargs.enable_thinking = false;
    modelKwargs.think = false;
    modelKwargs.thinking = { enabled: false };
  }

  return new ChatOpenAI({
    openAIApiKey: apiKey,
    configuration: {
      baseURL,
    },
    modelName: modelName,
    streaming: false,
    modelKwargs,
  });
}

export async function routeUserCommand(
  userMessage: string,
  modelName: string
): Promise<string> {
  const llm = getLangChainModel(modelName, false); // No need for thinking mode for simple routing
  const response = await llm.invoke([
    new SystemMessage(ROUTER_SYSTEM_PROMPT),
    new HumanMessage(userMessage)
  ]);
  return typeof response.content === "string" ? response.content.trim() : "";
}

export async function* streamLangChainChat(
  messages: { role: string; content: string }[],
  modelName: string,
  enableThinking: boolean,
  mode: "translator" | "chat"
): AsyncGenerator<string, void, unknown> {
  const llm = getLangChainModel(modelName, enableThinking);
  const parser = new StringOutputParser();

  const lcMessages = messages.map(m => {
    if (m.role === 'user') return new HumanMessage(m.content);
    if (m.role === 'assistant') return new AIMessage(m.content);
    return new SystemMessage(m.content);
  });

  if (mode === "translator") {
    // Ensure system prompt is first if not already
    if (lcMessages.length === 0 || lcMessages[0]._getType() !== 'system') {
      lcMessages.unshift(new SystemMessage(TRANSLATOR_SYSTEM_PROMPT));
    }
  }

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
  enableThinking: boolean
): AsyncGenerator<string, void, unknown> {
  const llm = getLangChainModel(modelName, enableThinking);
  const tools = await getFsTools();
  
  const agent = createReactAgent({
    llm,
    tools,
  });

  const lcMessages = messages.map(m => {
    if (m.role === 'user') return new HumanMessage(m.content);
    if (m.role === 'assistant') return new AIMessage(m.content);
    return new SystemMessage(m.content);
  });

  const eventStream = await agent.streamEvents(
    { messages: lcMessages },
    { version: "v2" }
  );

  for await (const event of eventStream) {
    if (event.event === "on_chat_model_stream") {
      const chunk = event.data?.chunk?.content;
      if (chunk && typeof chunk === "string") {
        yield chunk;
      }
    } else if (event.event === "on_tool_start") {
      yield `\n\n> 🤖 **Mengeksekusi tool:** \`${event.name}\`...\n\n`;
    } else if (event.event === "on_tool_end") {
      // Tidak perlu yield hasil tool secara penuh jika terlalu panjang, cukup notifikasi
      yield `\n\n> ✅ **Tool selesai**\n\n`;
    }
  }
}

