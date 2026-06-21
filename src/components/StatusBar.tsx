import React, { useState, useEffect } from 'react';
import { Box, Text } from 'ink';
import chalk from 'chalk';
import ora from 'ora'; // Import to satisfy dependency requirement and ensure it's available

interface StatusBarProps {
  status: 'idle' | 'thinking' | 'calling_tool' | 'complete' | 'error';
  tokenCount: number;
  enableThinking: boolean;
}

export const StatusBar: React.FC<StatusBarProps> = ({ status, tokenCount, enableThinking }) => {
  const [frameIndex, setFrameIndex] = useState(0);

  // Default ora 'dots' spinner frames
  const spinnerFrames = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'];

  useEffect(() => {
    if (status !== 'thinking' && status !== 'calling_tool') {
      return;
    }

    const interval = setInterval(() => {
      setFrameIndex(prev => (prev + 1) % spinnerFrames.length);
    }, 80);

    return () => clearInterval(interval);
  }, [status]);

  const getStatusProps = () => {
    switch (status) {
      case 'idle':
        return { text: 'IDLE', color: 'gray' };
      case 'thinking':
        return enableThinking ? { text: 'THINKING', color: 'yellow' } : { text: 'GENERATING', color: 'blue' };
      case 'calling_tool':
        return { text: 'CALLING TOOL', color: 'magenta' };
      case 'complete':
        return { text: 'COMPLETE', color: 'green' };
      case 'error':
        return { text: 'ERROR', color: 'red' };
      default:
        return { text: status, color: 'white' };
    }
  };

  return (
    <Box
      borderStyle="single"
      borderColor="gray"
      paddingX={0}
      marginTop={0}
      flexDirection="column"
    >
      <Box flexDirection="row" justifyContent="space-between">
        <Box flexDirection="row">
          {(status === 'thinking' || status === 'calling_tool') && (
            <Box marginRight={1}>
              <Text color={enableThinking ? "yellow" : "blue"}>
                {spinnerFrames[frameIndex]}
              </Text>
            </Box>
          )}
          <Text bold>System Status: </Text>
          <Text color={getStatusProps().color}>{getStatusProps().text}</Text>
        </Box>
        <Box>
          <Text color="gray">Est. Tokens: </Text>
          <Text color="cyan" bold>{tokenCount}</Text>
        </Box>
      </Box>
      <Box flexDirection="row" marginTop={0}>
        <Text color="gray">Thinking: </Text>
        <Text color={enableThinking ? "green" : "red"} bold>{enableThinking ? "true" : "false"}</Text>
      </Box>
    </Box>
  );
};
