import React, { useState, useRef, useEffect } from 'react';
import { Box, Text, useInput } from 'ink';
import fs from 'fs';
import path from 'path';
import os from 'os';

interface InputBarProps {
  onSubmit: (value: string) => void;
  onClearScreen: () => void;
  status: string;
}

const HISTORY_FILE = path.join(os.homedir(), '.english_cli_history');
const COMMANDS = ['/help', '/clear', '/read', '/write', '/ls', '/pwd', '/mode', '/model', '/exit'];

function loadHistory(): string[] {
  try {
    if (fs.existsSync(HISTORY_FILE)) {
      const content = fs.readFileSync(HISTORY_FILE, 'utf8');
      return content
        .split('\n')
        .map(line => line.trim())
        .filter(line => line.length > 0);
    }
  } catch (err) {
    // Ignore read errors
  }
  return [];
}

function saveHistoryEntry(entry: string) {
  try {
    fs.appendFileSync(HISTORY_FILE, entry + '\n', 'utf8');
  } catch (err) {
    // Ignore write errors
  }
}

export const InputBar: React.FC<InputBarProps> = ({ onSubmit, onClearScreen, status }) => {
  const [value, setValue] = useState('');
  const [cursorIndex, setCursorIndex] = useState(0);

  // Use a mutable ref to track the latest state synchronously during useInput events.
  // This prevents stale closures when React batches state updates (e.g., during rapid typing or holding backspace).
  const stateRef = useRef({ val: '', idx: 0 });

  // History references
  const historyRef = useRef<string[]>([]);
  const historyIndexRef = useRef<number>(-1);
  const draftRef = useRef<string>('');

  // Load history on mount
  useEffect(() => {
    historyRef.current = loadHistory();
  }, []);

  const updateState = (newVal: string, newIdx: number) => {
    stateRef.current = { val: newVal, idx: newIdx };
    setValue(newVal);
    setCursorIndex(newIdx);
  };

  useInput((input, key) => {
    // Ctrl+C to exit (Ink usually handles this, but explicit handling is safer)
    if (key.ctrl && input === 'c') {
      process.exit(0);
    }

    // Ctrl+L to clear screen
    if (key.ctrl && input === 'l') {
      onClearScreen();
      return;
    }

    const currentVal = stateRef.current.val;
    const currentCol = stateRef.current.idx;

    const getSuggestion = (val: string) => {
      if (!val.startsWith('/') || val.length === 0 || val.includes(' ')) return '';
      const match = COMMANDS.find(cmd => cmd.startsWith(val.toLowerCase()));
      if (match && match !== val.toLowerCase()) {
        return match.slice(val.length);
      }
      return '';
    };
    
    const suggestion = getSuggestion(currentVal);

    // Tab to autocomplete
    if (key.tab) {
      if (suggestion && currentCol === currentVal.length) {
        const newVal = currentVal + suggestion;
        updateState(newVal, newVal.length);
      }
      return;
    }

    // Enter to submit
    if (key.return) {
      const trimmed = currentVal.trim();
      if (trimmed) {
        onSubmit(trimmed);
        
        // Append to history
        const hist = historyRef.current;
        if (hist.length === 0 || hist[hist.length - 1] !== trimmed) {
          hist.push(trimmed);
          saveHistoryEntry(trimmed);
        }
        
        // Reset history pointer and state
        historyIndexRef.current = -1;
        draftRef.current = '';
        updateState('', 0);
      }
      return;
    }

    // Arrow Up to traverse history backward (older commands)
    if (key.upArrow) {
      const hist = historyRef.current;
      if (hist.length === 0) return;

      const currentIndex = historyIndexRef.current;
      if (currentIndex === -1) {
        // Save current typed draft
        draftRef.current = currentVal;
      }

      const nextIndex = Math.min(hist.length - 1, currentIndex + 1);
      historyIndexRef.current = nextIndex;

      const historicalVal = hist[hist.length - 1 - nextIndex] || '';
      updateState(historicalVal, historicalVal.length);
      return;
    }

    // Arrow Down to traverse history forward (newer commands / back to draft)
    if (key.downArrow) {
      const hist = historyRef.current;
      const currentIndex = historyIndexRef.current;
      if (currentIndex === -1) return;

      const nextIndex = currentIndex - 1;
      historyIndexRef.current = nextIndex;

      if (nextIndex === -1) {
        // Restore draft
        updateState(draftRef.current, draftRef.current.length);
      } else {
        const historicalVal = hist[hist.length - 1 - nextIndex] || '';
        updateState(historicalVal, historicalVal.length);
      }
      return;
    }

    // Arrow Left
    if (key.leftArrow) {
      updateState(currentVal, Math.max(0, currentCol - 1));
      return;
    }

    // Arrow Right
    if (key.rightArrow) {
      if (suggestion && currentCol === currentVal.length) {
        const newVal = currentVal + suggestion;
        updateState(newVal, newVal.length);
      } else {
        updateState(currentVal, Math.min(currentVal.length, currentCol + 1));
      }
      return;
    }

    // Backspace to delete character (handles Windows cmd/powershell key mapping variations)
    // Note: Some terminals map Backspace to key.delete, so we treat key.delete as Backspace.
    if (
      key.backspace ||
      key.delete ||
      input === '\b' ||
      input === '\x7f' ||
      input === '\u007f' ||
      input === '\u0008'
    ) {
      if (currentCol > 0) {
        const newVal = currentVal.slice(0, currentCol - 1) + currentVal.slice(currentCol);
        updateState(newVal, currentCol - 1);
      }
      return;
    }

    // Ignore special navigation keys for simplicity
    if (
      key.escape ||
      key.meta ||
      key.ctrl
    ) {
      return;
    }

    // Append standard character input (only printable characters, ignore control codes)
    const isControlChar = input && (input.charCodeAt(0) < 32 || input.charCodeAt(0) === 127);
    if (input && !isControlChar) {
      const newVal = currentVal.slice(0, currentCol) + input + currentVal.slice(currentCol);
      updateState(newVal, currentCol + input.length);
    }
  });

  const isThinking = status === 'thinking' || status === 'calling_tool';

  const renderInputText = () => {
    const suggestion = (() => {
      if (!value.startsWith('/') || value.length === 0 || value.includes(' ')) return '';
      const match = COMMANDS.find(cmd => cmd.startsWith(value.toLowerCase()));
      if (match && match !== value.toLowerCase()) {
        return match.slice(value.length);
      }
      return '';
    })();

    if (cursorIndex === value.length) {
      return (
        <>
          <Text color="white">{value}</Text>
          <Text color="cyan" dimColor>█</Text>
          {suggestion && <Text color="gray">{suggestion}</Text>}
        </>
      );
    }

    const before = value.slice(0, cursorIndex);
    const cursorChar = value[cursorIndex] || ' ';
    const after = value.slice(cursorIndex + 1);

    return (
      <>
        <Text color="white">{before}</Text>
        <Text backgroundColor="white" color="black">{cursorChar}</Text>
        <Text color="white">{after}</Text>
      </>
    );
  };

  return (
    <Box flexDirection="row" marginTop={0}>
      <Text bold color="cyan">{'> '}</Text>
      {isThinking ? (
        <Text italic color="gray">Thinking...</Text>
      ) : (
        renderInputText()
      )}
    </Box>
  );
};
