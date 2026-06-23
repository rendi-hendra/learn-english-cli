import React from "react";
import { BaseModeLayout } from "./BaseModeLayout.js";
import { useChatStore } from "../store/chatStore.js";
import { useTranslatorMode } from "../hooks/useTranslatorMode.js";
import { useCommonCommands } from "../hooks/useCommonCommands.js";
import { InputValidator } from "../utils/validation.js";
import { useClipboardWatcher } from "../hooks/useClipboardWatcher.js";

interface TranslatorModeProps {
  onExitModeSelection: () => void;
  onExitModelSelection: () => void;
}

export const TranslatorMode: React.FC<TranslatorModeProps> = ({
  onExitModeSelection,
  onExitModelSelection,
}) => {
  const {
    startConversation,
    updateSystemMessage,
  } = useChatStore();

  const { handleTranslate } = useTranslatorMode();
  const { handleCommonCommand } = useCommonCommands(
    onExitModeSelection,
    onExitModelSelection
  );

  useClipboardWatcher({
    enabled: true,
    onClipboardChange: async (text) => {
      startConversation(text);
      await handleTranslate(text, true);
    },
  });

  const handleSubmit = async (value: string) => {
    const trimmed = value.trim();
    if (!trimmed) return;

    const allowedCommands = ["/exit", "/clear", "/help", "/mode", "/model", "/read", "/write", "/ls", "/pwd"];
    const allowedModels = ["qwen3.7-max", "gpt-4o", "gpt-3.5-turbo", "gpt-4o-mini", "o1-mini", "o1-preview", "gemini-2.5-flash", "gemma-2b-it", "gpt-4", "claude-3-5-sonnet", "claude-3-opus", "gemini-1.5-flash", "gemini-1.5-pro"];

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

    startConversation(sanitized);
    await handleTranslate(sanitized, false);
  };

  return <BaseModeLayout onSubmit={handleSubmit} />;
};
