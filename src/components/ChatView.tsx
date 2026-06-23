import React from "react";
import { Box } from "ink";
import { CurrentConversation, ApiMessage } from "../types/chat.js";
import { MessageComponent } from "./Message.js";

interface ChatViewProps {
  currentConversation: CurrentConversation | null;
  apiHistory?: ApiMessage[];
}

export const ChatView: React.FC<ChatViewProps> = ({
  currentConversation,
  apiHistory,
}) => {
  if (!currentConversation && (!apiHistory || apiHistory.length === 0)) {
    return null; // Empty state
  }

  return (
    <Box flexDirection="column" borderStyle={"round"} paddingX={2}>
      {/* Render all past messages */}
      {apiHistory &&
        apiHistory.map((msg, idx) => (
          <Box key={idx}>
            <MessageComponent role={msg.role} content={msg.content} />
          </Box>
        ))}

      {/* Render current conversation */}
      {currentConversation && (
        <>
          <MessageComponent role="user" content={currentConversation.user} />
          {/* Show system message (e.g. tool results) if it exists */}
          {currentConversation.system && (
            <MessageComponent
              role="system"
              content={currentConversation.system}
              formattedContent={currentConversation.systemFormatted}
            />
          )}

          {/* Show assistant message if it exists */}
          {currentConversation?.assistant && (
            <MessageComponent
              role="assistant"
              content={currentConversation.assistant}
              formattedContent={currentConversation.assistantFormatted}
            />
          )}
        </>
      )}
    </Box>
  );
};
