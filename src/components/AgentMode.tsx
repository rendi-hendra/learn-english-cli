import React from "react";
import { BaseModeLayout } from "./BaseModeLayout.js";
import { useChatStore } from "../store/chatStore.js";
import { useAgentMode } from "../hooks/useAgentMode.js";
import { useCommonCommands } from "../hooks/useCommonCommands.js";
import { executeCommandLocally } from "../utils/commandExecutor.js";
import { renderMarkdownWithGlow } from "../utils/markdown.js";
import { InputValidator } from "../utils/validation.js";

interface AgentModeProps {
  onExitModeSelection: () => void;
  onExitModelSelection: () => void;
}

export const AgentMode: React.FC<AgentModeProps> = ({
  onExitModeSelection,
  onExitModelSelection,
}) => {
  const {
    startConversation,
    updateSystemMessage,
  } = useChatStore();

  const { handleAgent } = useAgentMode();
  const { handleCommonCommand } = useCommonCommands(
    onExitModeSelection,
    onExitModelSelection,
  );

  const handleSubmit = async (value: string) => {
    const trimmed = value.trim();
    if (!trimmed) return;

    const allowedCommands = [
      "/exit",
      "/clear",
      "/help",
      "/mode",
      "/model",
      "/read",
      "/write",
      "/ls",
      "/pwd",
    ];
    const allowedModels = [
      "qwen3.7-max",
      "gpt-4o",
      "gpt-3.5-turbo",
      "gpt-4o-mini",
      "o1-mini",
      "o1-preview",
      "gemini-2.5-flash",
      "gemma-2b-it",
      "gpt-4",
      "claude-3-5-sonnet",
      "claude-3-opus",
      "gemini-1.5-flash",
      "gemini-1.5-pro",
    ];

    const validation = InputValidator.validateUserInput(trimmed, {
      maxInputLength: 2000,
      allowedCommands,
      allowedModels,
    });

    if (!validation.isValid) {
      startConversation(trimmed);
      updateSystemMessage(`[Validation Error] ${validation.error}`);
      return;
    }

    const sanitized = validation.sanitizedInput || trimmed;

    if (handleCommonCommand(sanitized)) {
      return;
    }

    if (sanitized.startsWith("/")) {
      const parts = sanitized.split(" ");
      const command = parts[0];

      // Check file system commands in Agent Mode (explicit user commands)
      const cmdResult = executeCommandLocally(sanitized);
      if (cmdResult) {
        startConversation(sanitized);
        const outputMsg =
          command === "/read"
            ? `File berhasil dimuat ke dalam memori sesi.\n\n${cmdResult.output}`
            : cmdResult.output;
        const formattedOutput = renderMarkdownWithGlow(outputMsg);
        updateSystemMessage(outputMsg, formattedOutput);
        return;
      }

      startConversation(sanitized);
      updateSystemMessage(
        `Perintah tidak dikenal: ${command}. Ketik /help untuk melihat bantuan.`,
      );
      return;
    }

    startConversation(sanitized);
    await handleAgent(sanitized);
  };

  return <BaseModeLayout onSubmit={handleSubmit} />;
};
