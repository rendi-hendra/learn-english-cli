export type MessageRole = 'user' | 'assistant' | 'system';

export interface Message {
  id: string;
  role: MessageRole;
  content: string;
  timestamp: Date;
  tokens?: number;
  formattedContent?: string;
}

export type ChatStatus = 'idle' | 'thinking' | 'calling_tool' | 'complete' | 'error';

export type ConnectionStatus = 'connected' | 'disconnected';

export interface ChatState {
  messages: Message[];
  status: ChatStatus;
  activeModel: string;
  error: string | null;
  connectionStatus: ConnectionStatus;
  enableThinking: boolean;
}
