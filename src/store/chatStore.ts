import { useState, useEffect, useCallback } from "react";
import { ChatState, ChatStatus, ConnectionStatus } from "../types/chat.js";

export function estimateTokens(text: string): number {
  if (!text) return 0;
  // Estimate ~4 characters per token
  return Math.ceil(text.length / 4);
}

class ChatStore {
  private state: ChatState = {
    currentConversation: null,
    apiHistory: [],
    status: "idle",
    activeModel: "qwen3.7-max",
    error: null,
    connectionStatus: "connected",
    enableThinking: false,
    appMode: "translator",
  };

  private listeners = new Set<() => void>();

  getState(): ChatState {
    return this.state;
  }

  subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private emit() {
    for (const listener of this.listeners) {
      listener();
    }
  }

  startConversation(userText: string) {
    if (this.state.currentConversation) {
      // Save previous conversation to history
      if (this.state.currentConversation.user) {
        this.state.apiHistory.push({
          role: "user",
          content: this.state.currentConversation.user,
        });
      }
      if (this.state.currentConversation.assistant) {
        this.state.apiHistory.push({ role: "assistant", content: this.state.currentConversation.assistant });
      }
    }
    this.state = {
      ...this.state,
      currentConversation: { user: userText, assistant: "" },
    };
    this.emit();
  }

  updateAssistantMessage(content: string, formattedContent?: string) {
    if (this.state.currentConversation) {
      this.state = {
        ...this.state,
        currentConversation: {
          ...this.state.currentConversation,
          assistant: content,
          assistantFormatted: formattedContent,
        },
      };
      this.emit();
    }
  }

  updateSystemMessage(content: string, formattedContent?: string) {
    if (this.state.currentConversation) {
      this.state = {
        ...this.state,
        currentConversation: {
          ...this.state.currentConversation,
          system: content,
          systemFormatted: formattedContent,
        },
      };
      this.emit();
    }
  }

  addApiHistory(role: "user" | "assistant" | "system", content: string) {
    this.state.apiHistory.push({ role, content });
  }

  setStatus(status: ChatStatus) {
    this.state = { ...this.state, status };
    this.emit();
  }

  setActiveModel(activeModel: string) {
    this.state = { ...this.state, activeModel };
    this.emit();
  }

  setError(error: string | null) {
    this.state = { ...this.state, error };
    this.emit();
  }

  setConnectionStatus(connectionStatus: ConnectionStatus) {
    this.state = { ...this.state, connectionStatus };
    this.emit();
  }

  setEnableThinking(enableThinking: boolean) {
    this.state = { ...this.state, enableThinking };
    this.emit();
  }

  setAppMode(appMode: "translator" | "chat" | "agent") {
    this.state = { ...this.state, appMode };
    this.emit();
  }

  clearChat() {
    this.state = {
      ...this.state,
      currentConversation: null,
      apiHistory: [],
      status: "idle",
      error: null,
    };
    this.emit();
  }

  getMessageCount(): number {
    return (
      this.state.apiHistory.length + (this.state.currentConversation ? 2 : 0)
    );
  }

  getTotalTokens(): number {
    const historyTokens = this.state.apiHistory.reduce(
      (total, msg) => total + estimateTokens(msg.content),
      0,
    );
    const currentTokens = this.state.currentConversation
      ? estimateTokens(this.state.currentConversation.user) +
        estimateTokens(this.state.currentConversation.assistant)
      : 0;
    return historyTokens + currentTokens;
  }
}

export const chatStore = new ChatStore();

export function useChatStore() {
  const [state, setState] = useState(chatStore.getState());

  useEffect(() => {
    return chatStore.subscribe(() => {
      setState(chatStore.getState());
    });
  }, []);

  const startConversation = useCallback(
    (userText: string) => chatStore.startConversation(userText),
    [],
  );
  const updateAssistantMessage = useCallback(
    (content: string, formattedContent?: string) =>
      chatStore.updateAssistantMessage(content, formattedContent),
    [],
  );
  const updateSystemMessage = useCallback(
    (content: string, formattedContent?: string) =>
      chatStore.updateSystemMessage(content, formattedContent),
    [],
  );
  const addApiHistory = useCallback(
    (role: "user" | "assistant" | "system", content: string) =>
      chatStore.addApiHistory(role, content),
    [],
  );
  const setStatus = useCallback(
    (status: ChatStatus) => chatStore.setStatus(status),
    [],
  );
  const setActiveModel = useCallback(
    (model: string) => chatStore.setActiveModel(model),
    [],
  );
  const setError = useCallback(
    (error: string | null) => chatStore.setError(error),
    [],
  );
  const setConnectionStatus = useCallback(
    (status: ConnectionStatus) => chatStore.setConnectionStatus(status),
    [],
  );
  const setEnableThinking = useCallback(
    (enableThinking: boolean) => chatStore.setEnableThinking(enableThinking),
    [],
  );
  const setAppMode = useCallback(
    (mode: "translator" | "chat" | "agent") => chatStore.setAppMode(mode),
    [],
  );
  const clearChat = useCallback(() => chatStore.clearChat(), []);

  return {
    ...state,
    messageCount: chatStore.getMessageCount(),
    totalTokens: chatStore.getTotalTokens(),
    startConversation,
    updateAssistantMessage,
    updateSystemMessage,
    addApiHistory,
    setStatus,
    setActiveModel,
    setError,
    setConnectionStatus,
    setEnableThinking,
    setAppMode,
    clearChat,
  };
}
