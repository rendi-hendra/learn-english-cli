import React, { useState, useEffect } from 'react';
import { Box, Text, useInput } from 'ink';
import { getModels } from '../services/openai.js';

interface ModelSelectorProps {
  onSelect: (model: string) => void;
}

export const ModelSelector: React.FC<ModelSelectorProps> = ({ onSelect }) => {
  const [models, setModels] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);

  useEffect(() => {
    const fetchModels = async () => {
      const fetched = await getModels();
      setModels(fetched);
      setLoading(false);
    };
    fetchModels();
  }, []);

  const filteredModels = models.filter(m => m.toLowerCase().includes(search.toLowerCase()));

  useInput((input, key) => {
    if (loading) return;

    if (key.upArrow) {
      setSelectedIndex(Math.max(0, selectedIndex - 1));
      return;
    }
    if (key.downArrow) {
      setSelectedIndex(Math.min(filteredModels.length - 1, selectedIndex + 1));
      return;
    }
    if (key.return) {
      if (filteredModels.length > 0) {
        onSelect(filteredModels[selectedIndex]);
      }
      return;
    }
    if (key.backspace || key.delete || input === '\b' || input === '\x7f') {
      setSearch(search.slice(0, -1));
      setSelectedIndex(0);
      return;
    }
    
    // Ignore control characters and special navigation keys
    if (key.ctrl || key.meta || key.escape || key.tab || key.leftArrow || key.rightArrow) {
      return;
    }

    const isControlChar = input && (input.charCodeAt(0) < 32 || input.charCodeAt(0) === 127);
    if (input && !isControlChar) {
      setSearch(search + input);
      setSelectedIndex(0);
    }
  });

  if (loading) {
    return (
      <Box padding={1}>
        <Text color="yellow">Fetching models from 9router API...</Text>
      </Box>
    );
  }

  // Display max 10 items for clean UI
  const visibleStartIndex = Math.max(0, Math.min(selectedIndex - 4, Math.max(0, filteredModels.length - 10)));
  const visibleModels = filteredModels.slice(visibleStartIndex, visibleStartIndex + 10);

  return (
    <Box flexDirection="column" padding={1} borderStyle="round" borderColor="cyan">
      <Text bold color="cyan">Select Model to use for AI CLI</Text>
      <Box flexDirection="row" marginBottom={1}>
        <Text bold>Search: </Text>
        <Text color="white">{search}</Text>
        <Text color="cyan" dimColor>█</Text>
      </Box>
      
      {filteredModels.length === 0 ? (
        <Text color="red">No models found matching "{search}"</Text>
      ) : (
        <Box flexDirection="column">
          {visibleModels.map((m, i) => {
            const actualIndex = visibleStartIndex + i;
            const isSelected = actualIndex === selectedIndex;
            return (
              <Text key={m} color={isSelected ? 'green' : 'gray'} bold={isSelected}>
                {isSelected ? '> ' : '  '}{m}
              </Text>
            );
          })}
        </Box>
      )}
      <Box marginTop={1}>
        <Text color="gray" italic>Use Up/Down arrows to navigate, Enter to select, or type to search.</Text>
      </Box>
    </Box>
  );
};
