import React from "react";
import { Box } from "ink";
import { Header } from "./Header.js";
import { ChatView } from "./ChatView.js";
import { StatusBar } from "./StatusBar.js";
import { InputBar } from "./InputBar.js";
import { useChatStore } from "../store/chatStore.js";
import { useChatMode } from "../hooks/useChatMode.js";
import { executeCommandLocally } from "../utils/commandExecutor.js";
import { renderMarkdownWithGlow } from "../utils/markdown.js";
import { InputValidator } from "../utils/validation.js";

interface ChatModeProps {
  onExitModeSelection: () => void;
  onExitModelSelection: () => void;
}

export const ChatMode: React.FC<ChatModeProps> = ({
  onExitModeSelection,
  onExitModelSelection,
}) => {
  const {
    currentConversation,
    status,
    activeModel,
    connectionStatus,
    messageCount,
    totalTokens,
    enableThinking,
    startConversation,
    updateSystemMessage,
    clearChat,
  } = useChatStore();

  const { handleChat } = useChatMode();

  const handleSubmit = async (value: string) => {
    const trimmed = value.trim();
    if (!trimmed) return;

    const allowedCommands = ["/exit", "/clear", "/help", "/mode", "/model", "/read", "/write", "/ls", "/pwd"];
    const allowedModels = ["qwen3.7-max", "gpt-4o", "gpt-3.5-turbo", "gpt-4o-mini", "o1-mini", "o1-preview", "gemini-2.5-flash", "gemma-2b-it", "gpt-4", "claude-3-5-sonnet", "claude-3-opus", "gemini-1.5-flash", "gemini-1.5-pro"];

    const validation = InputValidator.validateUserInput(trimmed, {
      maxInputLength: 2000,
      allowedCommands,
      allowedModels,
    });

    if (!validation.isValid) {
      startConversation(trimmed);
      updateSystemMessage(`[Validation Error] ${validation.error}`);
      return;
    }

    const sanitized = validation.sanitizedInput || trimmed;

    if (sanitized.startsWith("/")) {
      const parts = sanitized.split(" ");
      const command = parts[0];

      if (command === "/exit") {
        process.exit(0);
      }
      if (command === "/clear") {
        clearChat();
        startConversation("/clear");
        updateSystemMessage("Riwayat obrolan telah dibersihkan.");
        return;
      }
      if (command === "/help") {
        startConversation("/help");
        updateSystemMessage(
          `Bantuan AI CLI:\n• /help                 - Menampilkan pesan bantuan ini\n• /clear                - Menghapus riwayat obrolan\n• /read [path_file]     - Membaca isi file lokal ke dalam konteks obrolan\n• /write [path_file] [content] - Menulis konten ke file\n• /ls [path_dir]        - Menampilkan daftar isi direktori\n• /pwd                  - Menampilkan direktori kerja saat ini\n• /mode                 - Menampilkan menu interaktif untuk beralih mode\n• /model                - Menampilkan menu interaktif untuk memilih model\n• /exit                 - Keluar dari aplikasi\n• Ctrl+L                - Membersihkan layar terminal\n• Ctrl+C                - Keluar dari aplikasi`
        );
        return;
      }
      if (command === "/mode") {
        onExitModeSelection();
        return;
      }
      if (command === "/model") {
        onExitModelSelection();
        return;
      }

      // Check file system commands in Chat Mode
      const cmdResult = executeCommandLocally(sanitized);
      if (cmdResult) {
        startConversation(sanitized);
        const outputMsg = command === "/read" 
          ? `File berhasil dimuat ke dalam memori sesi.\n\n${cmdResult.output}`
          : cmdResult.output;
        const formattedOutput = renderMarkdownWithGlow(outputMsg);
        updateSystemMessage(outputMsg, formattedOutput);
        return;
      }

      startConversation(sanitized);
      updateSystemMessage(
        `Perintah tidak dikenal: ${command}. Ketik /help untuk melihat bantuan.`
      );
      return;
    }

    startConversation(sanitized);
    await handleChat(sanitized);
  };

  const handleClearScreen = () => {
    clearChat();
  };

  return (
    <Box flexDirection="column">
      <Header
        model={activeModel}
        messageCount={messageCount}
        connectionStatus={connectionStatus}
        status={status}
        appMode="chat"
      />

      <Box flexDirection="column">
        <ChatView currentConversation={currentConversation} />
      </Box>

      <StatusBar
        status={status}
        tokenCount={totalTokens}
        enableThinking={enableThinking}
      />

      <InputBar
        onSubmit={handleSubmit}
        onClearScreen={handleClearScreen}
        status={status}
      />
    </Box>
  );
};
