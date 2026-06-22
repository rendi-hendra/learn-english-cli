import React, { useEffect, useState, useRef } from "react";
import { useChatStore } from "./store/chatStore.js";
import { ModelSelector } from "./components/ModelSelector.js";
import { ModeSelector } from "./components/ModeSelector.js";
import { saveLastModel } from "./utils/modelConfig.js";
import { TranslatorMode } from "./components/TranslatorMode.js";
import { ChatMode } from "./components/ChatMode.js";
import { AgentMode } from "./components/AgentMode.js";

interface AppProps {
  initialModel?: string;
  enableThinking?: boolean;
  enableClipboard?: boolean;
}

export const App: React.FC<AppProps> = ({
  initialModel,
  enableThinking = false,
  enableClipboard = false,
}) => {
  const {
    activeModel,
    appMode,
    setActiveModel,
    setEnableThinking,
    setAppMode,
    startConversation,
    updateSystemMessage,
  } = useChatStore();

  const [modelSelected, setModelSelected] = useState(!!initialModel);
  const [modeSelecting, setModeSelecting] = useState(false);

  // Set initial model if provided via CLI
  useEffect(() => {
    if (initialModel) {
      setActiveModel(initialModel);
      saveLastModel(initialModel);
      setModelSelected(true);
    }
  }, [initialModel, setActiveModel]);

  // Set initial thinking mode if provided via CLI
  useEffect(() => {
    setEnableThinking(enableThinking);
  }, [enableThinking, setEnableThinking]);

  const initializedClipboardRef = useRef(false);

  // Set initial mode to translator-clipboard if started with --clipboard flag
  useEffect(() => {
    if (!initializedClipboardRef.current) {
      initializedClipboardRef.current = true;
      if (enableClipboard && appMode === "translator") {
        setAppMode("translator-clipboard");
      }
    }
  }, [enableClipboard, appMode, setAppMode]);

  if (!modelSelected) {
    return (
      <ModelSelector
        onSelect={(model) => {
          setActiveModel(model);
          saveLastModel(model);
          setModelSelected(true);
        }}
      />
    );
  }

  if (modeSelecting) {
    return (
      <ModeSelector
        currentMode={appMode}
        onSelect={(mode) => {
          setAppMode(mode);
          setModeSelecting(false);
          startConversation(`/mode ${mode}`);
          updateSystemMessage(
            `Aplikasi beralih ke mode: ${mode.toUpperCase()}`,
          );
        }}
      />
    );
  }

  // Render mode-specific components
  switch (appMode) {
    case "translator":
      return (
        <TranslatorMode
          onExitModeSelection={() => setModeSelecting(true)}
          onExitModelSelection={() => setModelSelected(false)}
          enableClipboard={false}
        />
      );
    case "translator-clipboard":
      return (
        <TranslatorMode
          onExitModeSelection={() => setModeSelecting(true)}
          onExitModelSelection={() => setModelSelected(false)}
          enableClipboard={true}
        />
      );
    case "chat":
      return (
        <ChatMode
          onExitModeSelection={() => setModeSelecting(true)}
          onExitModelSelection={() => setModelSelected(false)}
        />
      );
    case "agent":
      return (
        <AgentMode
          onExitModeSelection={() => setModeSelecting(true)}
          onExitModelSelection={() => setModelSelected(false)}
        />
      );
    default:
      return (
        <ChatMode
          onExitModeSelection={() => setModeSelecting(true)}
          onExitModelSelection={() => setModelSelected(false)}
        />
      );
  }
};

