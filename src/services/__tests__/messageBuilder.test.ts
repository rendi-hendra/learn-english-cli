import { describe, it, expect } from "vitest";
import { MessageBuilder } from "../messageBuilder.js";
import { SystemMessage, HumanMessage, AIMessage } from "@langchain/core/messages";

describe("MessageBuilder", () => {
  it("should successfully build message array with system prompt for translator mode", () => {
    const messages = MessageBuilder.build({
      mode: "translator",
      enableThinking: false,
      messages: [{ role: "user", content: "Hello" }],
    });

    expect(messages.length).toBe(2);
    expect(messages[0]).toBeInstanceOf(SystemMessage);
    expect(messages[1]).toBeInstanceOf(HumanMessage);
    expect(messages[1].content).toBe("Hello");
  });

  it("should successfully build message array for chat mode without initial system prompt", () => {
    const messages = MessageBuilder.build({
      mode: "chat",
      enableThinking: false,
      messages: [
        { role: "user", content: "Hello" },
        { role: "assistant", content: "Hi there!" },
      ],
    });

    expect(messages.length).toBe(2);
    expect(messages[0]).toBeInstanceOf(HumanMessage);
    expect(messages[1]).toBeInstanceOf(AIMessage);
  });

  it("should throw error if system prompt is missing for non-chat mode", () => {
    expect(() =>
      MessageBuilder.build({
        mode: "invalid-mode" as any,
        enableThinking: false,
        messages: [{ role: "user", content: "Hello" }],
      })
    ).toThrowError("MessageBuilder: Missing or empty system prompt for mode 'invalid-mode'");
  });
});
