import React, { useEffect, useState } from "react";
import { Box } from "ink";
import { useChatStore } from "./store/chatStore.js";
import { Header } from "./components/Header.js";
import { ChatView } from "./components/ChatView.js";
import { StatusBar } from "./components/StatusBar.js";
import { InputBar } from "./components/InputBar.js";
import { streamLangChainChat, routeUserCommand } from "./services/langchain.js";
import { renderMarkdownWithGlow } from "./utils/markdown.js";
import { ModelSelector } from "./components/ModelSelector.js";
import { ModeSelector } from "./components/ModeSelector.js";
import { saveLastModel } from "./utils/modelConfig.js";
import { executeCommandLocally } from "./utils/commandExecutor.js";

interface AppProps {
  initialModel?: string;
  enableThinking?: boolean;
}

export const App: React.FC<AppProps> = ({
  initialModel,
  enableThinking = false,
}) => {
  const {
    currentConversation,
    apiHistory,
    status,
    activeModel,
    error,
    connectionStatus,
    messageCount,
    totalTokens,
    enableThinking: storeEnableThinking,
    startConversation,
    updateAssistantMessage,
    updateSystemMessage,
    addApiHistory,
    setStatus,
    setActiveModel,
    setError,
    setConnectionStatus,
    setEnableThinking,
    setAppMode,
    clearChat,
  } = useChatStore();
  const appMode = useChatStore().appMode;

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

  // Handle Ctrl+L (clear screen)
  const handleClearScreen = () => {
    // Note: We don't use process.stdout.write to avoid breaking Ink's internal layout.
    clearChat();
  };

  const handleSubmit = async (value: string) => {
    const trimmed = value.trim();
    if (!trimmed) return;

    // Do NOT clear terminal using process.stdout.write('\x1b[2J\x1b[H') 
    // because it breaks Ink's single-screen control.

    // Check if it's a direct command
    if (trimmed.startsWith("/")) {
      const parts = trimmed.split(" ");
      const command = parts[0];
      const args = parts.slice(1).join(" ").trim();

      // UI Commands
      switch (command) {
        case "/exit":
          process.exit(0);
          break;
        case "/clear":
          clearChat();
          startConversation("/clear");
          updateSystemMessage("Riwayat obrolan telah dibersihkan.");
          return;
        case "/help":
          startConversation("/help");
          updateSystemMessage(
            `Bantuan AI CLI:\n• /help                 - Menampilkan pesan bantuan ini\n• /clear                - Menghapus riwayat obrolan\n• /read [path_file]     - Membaca isi file lokal ke dalam konteks obrolan\n• /write [path_file] [content] - Menulis konten ke file\n• /ls [path_dir]        - Menampilkan daftar isi direktori\n• /pwd                  - Menampilkan direktori kerja saat ini\n• /mode                 - Menampilkan menu interaktif untuk beralih mode\n• /model                - Menampilkan menu interaktif untuk memilih model\n• /exit                 - Keluar dari aplikasi\n• Ctrl+L                - Membersihkan layar terminal\n• Ctrl+C                - Keluar dari aplikasi`,
          );
          return;
        case "/mode":
          if (args) {
            const m = args.toLowerCase();
            if (m === "translator" || m === "chat" || m === "agent") {
              setAppMode(m as any);
              startConversation(`/mode ${m}`);
              updateSystemMessage(
                `Aplikasi beralih ke mode: ${m.toUpperCase()}`,
              );
            } else {
              startConversation(`/mode ${m}`);
              updateSystemMessage(
                `Mode tidak valid. Pilihan: translator, chat, agent.`,
              );
            }
          } else {
            setModeSelecting(true);
          }
          return;
        case "/model":
          if (args) {
            setActiveModel(args);
            saveLastModel(args);
            startConversation(`/model ${args}`);
            updateSystemMessage(`Model berhasil diubah ke: ${args}`);
          } else {
            setModelSelected(false);
          }
          return;
      }

      // File system commands
      const cmdResult = executeCommandLocally(trimmed);
      if (cmdResult) {
        startConversation(trimmed);
        const outputMsg = command === "/read" 
          ? `File berhasil dimuat ke dalam memori sesi.\n\n${cmdResult.output}`
          : cmdResult.output;
        const formattedOutput = renderMarkdownWithGlow(outputMsg);
        updateSystemMessage(outputMsg, formattedOutput);
        return;
      }

      startConversation(trimmed);
      updateSystemMessage(
        `Perintah tidak dikenal: ${command}. Ketik /help untuk melihat bantuan.`,
      );
      return;
    }

    // Process as a prompt for the model
    startConversation(trimmed);
    setStatus("thinking");
    setError(null);

    // Prompts have been imported from src/config/prompts.ts

    let currentApiMessages = appMode === "translator"
      ? [{ role: "user" as const, content: trimmed }]
      : [
          ...apiHistory.map((m) => ({ role: m.role as any, content: m.content })),
          { role: "user" as const, content: trimmed },
        ];

    try {
      let fullResponse = "";

      if (appMode === "agent") {
        updateAssistantMessage("Menganalisis permintaan...");
        const routeResult = await routeUserCommand(trimmed, activeModel);
        
        if (routeResult.startsWith("/")) {
          const cmdResult = executeCommandLocally(routeResult);
          if (cmdResult) {
            updateAssistantMessage(`Menjalankan perintah: ${routeResult}`);
            
            const formattedOutput = renderMarkdownWithGlow(cmdResult.output);
            updateSystemMessage(cmdResult.output, formattedOutput);
            
            setConnectionStatus("connected");
            setStatus("complete");
            return;
          }
        }
        
        // Fallback to regular chat if model returns "chat" or non-command
        const generator = streamLangChainChat(currentApiMessages, activeModel, storeEnableThinking, "chat");
        for await (const chunk of generator) {
           fullResponse += chunk;
           updateAssistantMessage(fullResponse);
        }
      } else {
        const generator = streamLangChainChat(currentApiMessages, activeModel, storeEnableThinking, appMode);
        for await (const chunk of generator) {
           fullResponse += chunk;
           updateAssistantMessage(fullResponse);
        }
      }

      if (fullResponse) {
        const glowFormatted = renderMarkdownWithGlow(fullResponse);
        updateAssistantMessage(fullResponse, glowFormatted);
      } else {
        updateAssistantMessage("");
      }

      setConnectionStatus("connected");
      setStatus("complete");
    } catch (err: any) {
      setStatus("error");
      if (
        err.message.includes("internet") ||
        err.message.includes("koneksi") ||
        err.message.includes("putus")
      ) {
        setConnectionStatus("disconnected");
      }
      const errMsg = err.message || "Terjadi kesalahan sistem.";
      setError(errMsg);
      updateAssistantMessage(`Error: ${errMsg}`);
    }
  };

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
  return (
    <Box flexDirection="column">
      <Header
        model={activeModel}
        messageCount={messageCount}
        connectionStatus={connectionStatus}
        status={status}
        appMode={appMode}
      />

      <Box flexDirection="column">
        <ChatView currentConversation={currentConversation} />
      </Box>

      <StatusBar
        status={status}
        tokenCount={totalTokens}
        enableThinking={storeEnableThinking}
      />

      <InputBar
        onSubmit={handleSubmit}
        onClearScreen={handleClearScreen}
        status={status}
      />
    </Box>
  );
};
