import React, { createContext, useContext } from "react";
import { ChatStatus, ConnectionStatus } from "../types/chat.js";

export interface ChatContextProps {
  currentConversation: any;
  apiHistory: any[];
  status: ChatStatus;
  activeModel: string;
  connectionStatus: ConnectionStatus;
  messageCount: number;
  totalTokens: number;
  enableThinking: boolean;
  clearChat: () => void;
  handleSubmit: (value: string) => Promise<void>;
  handleClearScreen: () => void;
}

export const ChatContext = createContext<ChatContextProps | undefined>(undefined);

export const useChatContext = () => {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error("useChatContext must be used within a ChatProvider");
  }
  return context;
};
