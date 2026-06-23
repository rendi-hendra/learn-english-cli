import React from "react";
import { Box } from "ink";
import { Header } from "./Header.js";
import { ChatView } from "./ChatView.js";
import { StatusBar } from "./StatusBar.js";
import { InputBar } from "./InputBar.js";
import { useChatStore } from "../store/chatStore.js";

interface BaseModeLayoutProps {
  onSubmit: (value: string) => void;
}

export const BaseModeLayout: React.FC<BaseModeLayoutProps> = ({ onSubmit }) => {
  const {
    currentConversation,
    apiHistory,
    status,
    activeModel,
    connectionStatus,
    messageCount,
    appMode,
    enableThinking,
    clearChat,
  } = useChatStore();

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
        <ChatView
          currentConversation={currentConversation}
          apiHistory={apiHistory}
        />
      </Box>

      <InputBar
        onSubmit={onSubmit}
        onClearScreen={handleClearScreen}
        status={status}
      />

      <StatusBar
        status={status}
        enableThinking={enableThinking}
        model={activeModel}
      />
    </Box>
  );
};
