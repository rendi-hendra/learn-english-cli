import { useState, useEffect, useCallback } from "react";
import { ChatState, ChatStatus, ConnectionStatus } from "../types/chat.js";

export function estimateTokens(text: string): number {
  if (!text) return 0;
  // Estimate ~4 characters per token
  return Math.ceil(text.length / 4);
}

// Shallow equality helper for selector optimization
function shallowEqual(a: any, b: any): boolean {
  if (Object.is(a, b)) return true;
  if (typeof a !== "object" || a === null || typeof b !== "object" || b === null) return false;
  
  const keysA = Object.keys(a);
  const keysB = Object.keys(b);
  
  if (keysA.length !== keysB.length) return false;
  
  for (const key of keysA) {
    if (!Object.prototype.hasOwnProperty.call(b, key) || !Object.is(a[key], b[key])) {
      return false;
    }
  }
  return true;
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

  // Cached computation values
  private cachedStateForTokens: ChatState | null = null;
  private cachedTotalTokens = 0;
  private cachedStateForCount: ChatState | null = null;
  private cachedMessageCount = 0;

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
    const updatedHistory = [...this.state.apiHistory];
    if (this.state.currentConversation) {
      // Save previous conversation to history using immutable patterns
      if (this.state.currentConversation.user) {
        updatedHistory.push({
          role: "user",
          content: this.state.currentConversation.user,
        });
      }
      if (this.state.currentConversation.assistant) {
        updatedHistory.push({
          role: "assistant",
          content: this.state.currentConversation.assistant,
        });
      }
    }

    this.state = {
      ...this.state,
      apiHistory: updatedHistory,
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
    this.state = {
      ...this.state,
      apiHistory: [...this.state.apiHistory, { role, content }],
    };
    this.emit();
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
    if (this.cachedStateForCount === this.state) {
      return this.cachedMessageCount;
    }
    this.cachedMessageCount =
      this.state.apiHistory.length + (this.state.currentConversation ? 2 : 0);
    this.cachedStateForCount = this.state;
    return this.cachedMessageCount;
  }

  getTotalTokens(): number {
    if (this.cachedStateForTokens === this.state) {
      return this.cachedTotalTokens;
    }

    const historyTokens = this.state.apiHistory.reduce(
      (total, msg) => total + estimateTokens(msg.content),
      0,
    );
    const currentTokens = this.state.currentConversation
      ? estimateTokens(this.state.currentConversation.user) +
        estimateTokens(this.state.currentConversation.assistant)
      : 0;

    this.cachedTotalTokens = historyTokens + currentTokens;
    this.cachedStateForTokens = this.state;
    return this.cachedTotalTokens;
  }
}

export const chatStore = new ChatStore();

// Selector functions for fine-grained updates
export const selectCurrentConversation = (state: ChatState) => state.currentConversation;
export const selectApiHistory = (state: ChatState) => state.apiHistory;
export const selectStatus = (state: ChatState) => state.status;
export const selectActiveModel = (state: ChatState) => state.activeModel;
export const selectError = (state: ChatState) => state.error;
export const selectConnectionStatus = (state: ChatState) => state.connectionStatus;
export const selectEnableThinking = (state: ChatState) => state.enableThinking;
export const selectAppMode = (state: ChatState) => state.appMode;

export function useChatStore<T = ChatState>(selector?: (state: ChatState) => T) {
  const select = selector || ((s: ChatState) => s as any as T);
  const [selectedState, setSelectedState] = useState(() => select(chatStore.getState()));

  useEffect(() => {
    return chatStore.subscribe(() => {
      const nextSelected = select(chatStore.getState());
      setSelectedState((prev) => {
        if (shallowEqual(prev, nextSelected)) {
          return prev;
        }
        return nextSelected;
      });
    });
  }, [select]);

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

  // Return the selected state alongside stable action callbacks
  const resultState = typeof selectedState === "object" && selectedState !== null
    ? { ...selectedState }
    : selectedState;

  return {
    ...(typeof resultState === "object" ? resultState : { value: resultState }),
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
  } as any;
}
