import React from "react";
import { Box } from "ink";
import { Header } from "./Header.js";
import { ChatView } from "./ChatView.js";
import { StatusBar } from "./StatusBar.js";
import { InputBar } from "./InputBar.js";
import { useChatStore } from "../store/chatStore.js";
import { useTranslatorMode } from "../hooks/useTranslatorMode.js";
import { useCommonCommands } from "../hooks/useCommonCommands.js";
import { InputValidator } from "../utils/validation.js";
import { useClipboardWatcher } from "../hooks/useClipboardWatcher.js";

interface TranslatorModeProps {
  onExitModeSelection: () => void;
  onExitModelSelection: () => void;
  enableClipboard?: boolean;
}

export const TranslatorMode: React.FC<TranslatorModeProps> = ({
  onExitModeSelection,
  onExitModelSelection,
  enableClipboard = false,
}) => {
  const {
    currentConversation,
    status,
    activeModel,
    connectionStatus,
    messageCount,
    totalTokens,
    enableThinking,
    appMode,
    startConversation,
    updateSystemMessage,
    clearChat,
  } = useChatStore();

  const { handleTranslate } = useTranslatorMode();
  const { handleCommonCommand } = useCommonCommands(
    onExitModeSelection,
    onExitModelSelection
  );

  useClipboardWatcher({
    enabled: enableClipboard,
    onClipboardChange: async (text) => {
      startConversation(text);
      await handleTranslate(text);
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
    await handleTranslate(sanitized);
  };

  const handleClearScreen = () => {
    clearChat();
  };

  return (
    <Box flexDirection="column">
      <Header
        model={activeModel}
        messageCount={messageCount}
        connectionStatus={connectionStatus}
        status={status}
        appMode={appMode}
      />

      <Box flexDirection="column">
        <ChatView currentConversation={currentConversation} />
      </Box>

      <StatusBar
        status={status}
        tokenCount={totalTokens}
        enableThinking={enableThinking}
      />

      <InputBar
        onSubmit={handleSubmit}
        onClearScreen={handleClearScreen}
        status={status}
      />
    </Box>
  );
};
