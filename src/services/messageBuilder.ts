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

/**
 * Centralized message builder for constructing LangChain BaseMessage arrays.
 * Ensures consistent system prompt injection across all application modes.
 */
export class MessageBuilder {
  private static readonly PROMPT_MAP: Record<string, string | ((thinking: boolean) => string)> = {
    translator: (thinking: boolean) =>
      thinking ? TRANSLATOR_SYSTEM_PROMPT_THINKING : TRANSLATOR_SYSTEM_PROMPT,
    router: ROUTER_SYSTEM_PROMPT,
    agent: AGENT_SYSTEM_PROMPT,
  };

  static build(config: MessageBuilderConfig): BaseMessage[] {
    const lcMessages: BaseMessage[] = [];

    // 1. Resolve and inject system prompt
    const systemPrompt = this.resolveSystemPrompt(config.mode, config.enableThinking);

    if (config.mode !== "chat") {
      if (!systemPrompt || systemPrompt.trim() === "") {
        throw new Error(
          `MessageBuilder: Missing or empty system prompt for mode '${config.mode}'`,
        );
      }
    }

    if (systemPrompt) {
      lcMessages.push(new SystemMessage(systemPrompt));
    }

    // 2. Map user/assistant/system messages to LangChain types
    for (const msg of config.messages) {
      if (!msg.content) continue;

      switch (msg.role) {
        case "system":
          lcMessages.push(new SystemMessage(msg.content));
          break;
        case "assistant":
          lcMessages.push(new AIMessage(msg.content));
          break;
        default:
          lcMessages.push(new HumanMessage(msg.content));
          break;
      }
    }

    // 3. Final validation
    if (lcMessages.length === 0) {
      throw new Error("MessageBuilder: No messages provided to build.");
    }

    return lcMessages;
  }

  /**
   * Resolves the appropriate system prompt for a given mode.
   */
  private static resolveSystemPrompt(
    mode: string,
    enableThinking: boolean,
  ): string | null {
    const entry = this.PROMPT_MAP[mode];
    if (!entry) return null;
    return typeof entry === "function" ? entry(enableThinking) : entry;
  }
}
