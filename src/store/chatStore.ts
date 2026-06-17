import { useState, useEffect, useCallback } from 'react';
import { Message, ChatState, ChatStatus, ConnectionStatus } from '../types/chat.js';

export function estimateTokens(text: string): number {
  if (!text) return 0;
  // Estimate ~4 characters per token
  return Math.ceil(text.length / 4);
}

class ChatStore {
  private state: ChatState = {
    messages: [],
    status: 'idle',
    activeModel: 'qwen3.7-max',
    error: null,
    connectionStatus: 'connected',
    enableThinking: false,
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

  addMessage(role: 'user' | 'assistant' | 'system', content: string) {
    const newMessage: Message = {
      id: Math.random().toString(36).substring(7),
      role,
      content,
      timestamp: new Date(),
      tokens: estimateTokens(content),
    };
    this.state = {
      ...this.state,
      messages: [...this.state.messages, newMessage],
    };
    this.emit();
    return newMessage.id;
  }

  updateLastMessage(content: string, formattedContent?: string) {
    const messages = [...this.state.messages];
    if (messages.length === 0) return;
    const lastMsg = messages[messages.length - 1];
    if (lastMsg) {
      const updatedMsg = {
        ...lastMsg,
        content,
        formattedContent,
        tokens: estimateTokens(content),
      };
      messages[messages.length - 1] = updatedMsg;
      this.state = {
        ...this.state,
        messages,
      };
      this.emit();
    }
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

  clearChat() {
    this.state = {
      ...this.state,
      messages: [],
      status: 'idle',
      error: null,
    };
    this.emit();
  }

  getMessageCount(): number {
    return this.state.messages.length;
  }

  getTotalTokens(): number {
    return this.state.messages.reduce((total, msg) => total + (msg.tokens || 0), 0);
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

  const addMessage = useCallback((role: 'user' | 'assistant' | 'system', content: string) => chatStore.addMessage(role, content), []);
  const updateLastMessage = useCallback((content: string, formattedContent?: string) => chatStore.updateLastMessage(content, formattedContent), []);
  const setStatus = useCallback((status: ChatStatus) => chatStore.setStatus(status), []);
  const setActiveModel = useCallback((model: string) => chatStore.setActiveModel(model), []);
  const setError = useCallback((error: string | null) => chatStore.setError(error), []);
  const setConnectionStatus = useCallback((status: ConnectionStatus) => chatStore.setConnectionStatus(status), []);
  const setEnableThinking = useCallback((enableThinking: boolean) => chatStore.setEnableThinking(enableThinking), []);
  const clearChat = useCallback(() => chatStore.clearChat(), []);

  return {
    ...state,
    messageCount: chatStore.getMessageCount(),
    totalTokens: chatStore.getTotalTokens(),
    addMessage,
    updateLastMessage,
    setStatus,
    setActiveModel,
    setError,
    setConnectionStatus,
    setEnableThinking,
    clearChat,
  };
}
