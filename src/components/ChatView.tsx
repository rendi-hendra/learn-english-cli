import React from 'react';
import { Box } from 'ink';
import { Message } from '../types/chat.js';
import { MessageComponent } from './Message.js';

interface ChatViewProps {
  messages: Message[];
}

export const ChatView: React.FC<ChatViewProps> = ({ messages }) => {
  // Only show the latest interaction (from the last user message onward)
  // This creates a "fresh screen" effect where only current Q&A is visible
  const getLatestInteraction = () => {
    if (messages.length === 0) return [];
    
    // Find the index of the last user message
    let lastUserIndex = -1;
    for (let i = messages.length - 1; i >= 0; i--) {
      if (messages[i].role === 'user') {
        lastUserIndex = i;
        break;
      }
    }
    
    if (lastUserIndex === -1) {
      // No user message found, show the last few messages (e.g., system messages)
      return messages.slice(-3);
    }
    
    // Return from the last user message onward (user + assistant/system responses)
    return messages.slice(lastUserIndex);
  };

  const displayMessages = getLatestInteraction();

  return (
    <Box flexDirection="column">
      {displayMessages.map(msg => (
        <MessageComponent key={msg.id} role={msg.role} content={msg.content} formattedContent={msg.formattedContent} />
      ))}
    </Box>
  );
};
