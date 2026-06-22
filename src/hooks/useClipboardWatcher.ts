import { useEffect, useRef } from "react";
import clipboard from "clipboardy";

interface UseClipboardWatcherOptions {
  enabled: boolean;
  onClipboardChange: (text: string) => void;
  intervalMs?: number;
}

export function useClipboardWatcher({
  enabled,
  onClipboardChange,
  intervalMs = 1000,
}: UseClipboardWatcherOptions) {
  const lastTextRef = useRef<string>("");
  const callbackRef = useRef(onClipboardChange);

  // Keep callback ref updated so it doesn't trigger effect re-runs
  useEffect(() => {
    callbackRef.current = onClipboardChange;
  }, [onClipboardChange]);

  useEffect(() => {
    if (!enabled) return;

    // Read initial state so we don't trigger immediately on the first run
    try {
      const initialText = clipboard.readSync();
      lastTextRef.current = initialText ? initialText.trim() : "";
    } catch (err) {
      // Ignore initial read error
    }

    const interval = setInterval(async () => {
      try {
        const rawText = await clipboard.read();
        const currentText = rawText ? rawText.trim() : "";

        // Check if there's new text that isn't empty
        if (currentText && currentText !== lastTextRef.current) {
          lastTextRef.current = currentText;
          callbackRef.current(currentText);
        }
      } catch (err) {
        // Ignore read errors (e.g., clipboard busy or empty)
      }
    }, intervalMs);

    return () => clearInterval(interval);
  }, [enabled, intervalMs]);
}
