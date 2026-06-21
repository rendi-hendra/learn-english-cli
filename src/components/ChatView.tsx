import React from 'react';
import { Box } from 'ink';
import { CurrentConversation } from '../types/chat.js';
import { MessageComponent } from './Message.js';

interface ChatViewProps {
  currentConversation: CurrentConversation | null;
}

export const ChatView: React.FC<ChatViewProps> = ({ currentConversation }) => {
  if (!currentConversation) {
    return null; // Empty state
  }

  return (
    <Box flexDirection="column">
      {/* Always show user message */}
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
      {currentConversation.assistant && (
        <MessageComponent 
          role="assistant" 
          content={currentConversation.assistant} 
          formattedContent={currentConversation.assistantFormatted} 
        />
      )}
    </Box>
  );
};
