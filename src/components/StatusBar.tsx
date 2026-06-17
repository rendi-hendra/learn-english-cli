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

  const getStatusStyled = () => {
    switch (status) {
      case 'idle':
        return chalk.gray('IDLE');
      case 'thinking':
        return enableThinking ? chalk.yellow('THINKING') : chalk.blue('GENERATING');
      case 'calling_tool':
        return chalk.magenta('CALLING TOOL');
      case 'complete':
        return chalk.green('COMPLETE');
      case 'error':
        return chalk.red('ERROR');
      default:
        return status;
    }
  };

  return (
    <Box
      borderStyle="single"
      borderColor="gray"
      paddingX={1}
      marginTop={0}
      flexDirection="column"
      width={60}
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
          <Text>{getStatusStyled()}</Text>
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
