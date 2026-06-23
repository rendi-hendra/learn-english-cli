import React from "react";
import { Box, Text } from "ink";
import { renderMarkdown } from "../utils/markdown.js";
import { MessageRole } from "../types/chat.js";

interface MessageProps {
  role: MessageRole;
  content: string;
  formattedContent?: string;
}

export const MessageComponent: React.FC<MessageProps> = ({
  role,
  content,
  formattedContent,
}) => {
  const isUser = role === "user";
  const isSystem = role === "system";

  let prefix = "Assistant:";
  let prefixColor = "green";

  if (isUser) {
    prefix = "You:";
    prefixColor = "cyan";
  } else if (isSystem) {
    prefix = "System:";
    prefixColor = "gray";
  }

  // Format content
  // User messages are displayed as raw text to keep them clean
  // Assistant messages support markdown formatting (using Glow formatting if pre-rendered)
  const displayContent = isUser
    ? content
    : formattedContent || renderMarkdown(content);

  return (
    <Box flexDirection="column" marginTop={1}>
      <Text bold color={prefixColor}>
        {prefix}
      </Text>
      <Box flexDirection="column" paddingLeft={isUser ? 2 : 0}>
        <Text>{displayContent}</Text>
      </Box>
    </Box>
  );
};
