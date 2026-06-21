import { StringOutputParser } from "@langchain/core/output_parsers";
import { createReactAgent } from "@langchain/langgraph/prebuilt";
import { getFsTools } from "../tools/index.js";
import { getLangChainModel } from "./modelManager.js";
import { MessageBuilder } from "./messageBuilder.js";

// Re-export for backward compatibility
export { getLangChainModel } from "./modelManager.js";
export { MessageBuilder, type MessageBuilderConfig } from "./messageBuilder.js";

/**
 * Routes a user message to determine if it maps to a local command.
 * Uses a non-thinking LLM call with the ROUTER_SYSTEM_PROMPT.
 */
export async function routeUserCommand(
  userMessage: string,
  modelName: string,
): Promise<string> {
  const llm = getLangChainModel(modelName, false);
  const lcMessages = MessageBuilder.build({
    mode: "router",
    enableThinking: false,
    messages: [{ role: "user", content: userMessage }],
  });
  const response = await llm.invoke(lcMessages);
  return typeof response.content === "string" ? response.content.trim() : "";
}

/**
 * Streams a chat/translator response from the LLM.
 */
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

/**
 * Streams an agent response using LangGraph's ReAct agent with filesystem tools.
 */
export async function* streamLangChainAgent(
  messages: { role: string; content: string }[],
  modelName: string,
  enableThinking: boolean,
): AsyncGenerator<string, void, unknown> {
  const llm = getLangChainModel(modelName, enableThinking);
  const tools = await getFsTools();

  const agent = createReactAgent({ llm, tools });

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
