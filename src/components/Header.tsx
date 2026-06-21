import React from 'react';
import { Box, Text } from 'ink';
import { ConnectionStatus } from '../types/chat.js';

interface HeaderProps {
  model: string;
  messageCount: number;
  connectionStatus: ConnectionStatus;
  status: string;
  appMode: 'translator' | 'chat' | 'agent';
}

export const Header: React.FC<HeaderProps> = ({
  model,
  messageCount,
  connectionStatus,
  status,
  appMode,
}) => {
  const connColor = connectionStatus === 'connected' ? 'green' : 'red';
  const statusColor = 
    status === 'error' ? 'red' : 
    status === 'thinking' ? 'yellow' : 
    status === 'calling_tool' ? 'magenta' :
    status === 'complete' ? 'green' : 'cyan';

  return (
    <Box
      borderStyle="round"
      borderColor="cyan"
      flexDirection="column"
      paddingX={0}
      marginBottom={0}
    >
      <Box justifyContent="space-between" marginBottom={0}>
        <Text bold color="cyan">🤖 AI CLI TERMINAL</Text>
        <Text color="gray">v1.0.0</Text>
      </Box>
      <Box>
        <Text bold>Mode:       </Text>
        <Text color={appMode === 'translator' ? "magenta" : appMode === 'chat' ? "blue" : "yellow"}>{appMode.toUpperCase()}</Text>
      </Box>
      <Box>
        <Text bold>Model:      </Text>
        <Text color="green">{model}</Text>
      </Box>
      <Box>
        <Text bold>Messages:   </Text>
        <Text color="white">{messageCount}</Text>
      </Box>
      <Box>
        <Text bold>Connection: </Text>
        <Text color={connColor}>{connectionStatus.toUpperCase()}</Text>
      </Box>
      <Box>
        <Text bold>Status:     </Text>
        <Text color={statusColor}>{status.toUpperCase()}</Text>
      </Box>
    </Box>
  );
};
