import React, { useState } from 'react';
import { Box, Text, useInput } from 'ink';

export type AppMode = 'translator' | 'chat' | 'agent';

interface ModeSelectorProps {
  onSelect: (mode: AppMode) => void;
  currentMode: AppMode;
}

const MODES: { id: AppMode; label: string; desc: string }[] = [
  { id: 'translator', label: 'Translator', desc: 'Penerjemah ketat dengan pantauan clipboard otomatis' },
  { id: 'chat', label: 'Chat', desc: 'Asisten AI standar (mirip ChatGPT)' },
  { id: 'agent', label: 'Agent', desc: 'Agen otonom dengan akses ke tool system (eksperimental)' },
];

export const ModeSelector: React.FC<ModeSelectorProps> = ({ onSelect, currentMode }) => {
  const initialIndex = Math.max(0, MODES.findIndex(m => m.id === currentMode));
  const [selectedIndex, setSelectedIndex] = useState(initialIndex);

  useInput((_, key) => {
    if (key.upArrow) {
      setSelectedIndex(Math.max(0, selectedIndex - 1));
      return;
    }
    if (key.downArrow) {
      setSelectedIndex(Math.min(MODES.length - 1, selectedIndex + 1));
      return;
    }
    if (key.return) {
      onSelect(MODES[selectedIndex].id);
      return;
    }
  });

  return (
    <Box flexDirection="column" padding={1} borderStyle="round" borderColor="magenta">
      <Text bold color="magenta">Select App Mode</Text>
      
      <Box flexDirection="column" marginY={1}>
        {MODES.map((m, i) => {
          const isSelected = i === selectedIndex;
          const color = isSelected ? 'green' : 'gray';
          return (
            <Box key={m.id} flexDirection="row">
              <Box width={15}>
                <Text color={color} bold={isSelected}>
                  {isSelected ? '> ' : '  '}{m.label}
                </Text>
              </Box>
              <Text color={isSelected ? 'white' : 'gray'} italic>
                - {m.desc}
              </Text>
            </Box>
          );
        })}
      </Box>
      <Box marginTop={0}>
        <Text color="gray" italic>Gunakan Panah Atas/Bawah untuk memilih, lalu tekan Enter.</Text>
      </Box>
    </Box>
  );
};
