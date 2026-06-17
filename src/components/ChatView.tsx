import React from 'react';
import { Box } from 'ink';
import { Message } from '../types/chat.js';
import { MessageComponent } from './Message.js';

interface ChatViewProps {
  messages: Message[];
}

export const ChatView: React.FC<ChatViewProps> = ({ messages }) => {
  return (
    <Box flexDirection="column">
      {messages.map(msg => (
        <MessageComponent key={msg.id} role={msg.role} content={msg.content} formattedContent={msg.formattedContent} />
      ))}
    </Box>
  );
};
