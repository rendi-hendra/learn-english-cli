export type MessageRole = "user" | "assistant" | "system";

export interface CurrentConversation {
  user: string;
  assistant: string;
  system?: string;
  assistantFormatted?: string;
  systemFormatted?: string;
}

export interface ApiMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

export type ChatStatus =
  | "idle"
  | "thinking"
  | "calling_tool"
  | "complete"
  | "error";

export type ConnectionStatus = "connected" | "disconnected";

export interface ChatState {
  currentConversation: CurrentConversation | null;
  apiHistory: ApiMessage[];
  status: ChatStatus;
  activeModel: string;
  error: string | null;
  connectionStatus: ConnectionStatus;
  enableThinking: boolean;
  appMode: "translator" | "chat" | "agent";
}
