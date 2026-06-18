import React, { useEffect, useState } from 'react';
import { Box } from 'ink';
import fs from 'fs';
import path from 'path';
import { useChatStore } from './store/chatStore.js';
import { Header } from './components/Header.js';
import { ChatView } from './components/ChatView.js';
import { StatusBar } from './components/StatusBar.js';
import { InputBar } from './components/InputBar.js';
import { streamChatCompletion } from './services/openai.js';
import { renderMarkdownWithGlow } from './utils/markdown.js';
import { ModelSelector } from './components/ModelSelector.js';
import { ModeSelector } from './components/ModeSelector.js';
import { saveLastModel } from './utils/modelConfig.js';
import { executeCommandLocally } from './utils/commandExecutor.js';

interface AppProps {
  initialModel?: string;
  enableThinking?: boolean;
}

export const App: React.FC<AppProps> = ({ initialModel, enableThinking = false }) => {
  const {
    messages,
    status,
    activeModel,
    error,
    connectionStatus,
    messageCount,
    totalTokens,
    enableThinking: storeEnableThinking,
    addMessage,
    updateLastMessage,
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
    console.clear();
  };

  const handleSubmit = async (value: string) => {
    const trimmed = value.trim();
    if (!trimmed) return;

    // Check if it's a direct command
    if (trimmed.startsWith('/')) {
      const parts = trimmed.split(' ');
      const command = parts[0];
      const args = parts.slice(1).join(' ').trim();

      // UI Commands
      switch (command) {
        case '/exit':
          process.exit(0);
          break;
        case '/clear':
          clearChat();
          addMessage('system', 'Riwayat obrolan telah dibersihkan.');
          return;
        case '/help':
          addMessage('system', `Bantuan AI CLI:\n• /help                 - Menampilkan pesan bantuan ini\n• /clear                - Menghapus riwayat obrolan\n• /read [path_file]     - Membaca isi file lokal ke dalam konteks obrolan\n• /write [path_file] [content] - Menulis konten ke file\n• /ls [path_dir]        - Menampilkan daftar isi direktori\n• /pwd                  - Menampilkan direktori kerja saat ini\n• /mode                 - Menampilkan menu interaktif untuk beralih mode\n• /model                - Menampilkan menu interaktif untuk memilih model\n• /exit                 - Keluar dari aplikasi\n• Ctrl+L                - Membersihkan layar terminal\n• Ctrl+C                - Keluar dari aplikasi`);
          return;
        case '/mode':
          if (args) {
            const m = args.toLowerCase();
            if (m === 'translator' || m === 'chat' || m === 'agent') {
              setAppMode(m as any);
              addMessage('system', `Aplikasi beralih ke mode: ${m.toUpperCase()}`);
            } else {
              addMessage('system', `Mode tidak valid. Pilihan: translator, chat, agent.`);
            }
          } else {
            setModeSelecting(true);
          }
          return;
        case '/model':
          if (args) {
            setActiveModel(args);
            saveLastModel(args);
            addMessage('system', `Model berhasil diubah ke: ${args}`);
          } else {
            setModelSelected(false);
          }
          return;
      }

      // File system commands
      const cmdResult = executeCommandLocally(trimmed);
      if (cmdResult) {
        if (command === '/read') {
          addMessage('user', cmdResult.output);
          addMessage('system', `File berhasil dimuat ke dalam memori sesi.`);
        } else {
          addMessage('system', cmdResult.output);
        }
        return;
      }

      addMessage('system', `Perintah tidak dikenal: ${command}. Ketik /help untuk melihat bantuan.`);
      return;
    }

    // Process as a prompt for the model
    addMessage('user', trimmed);
    setStatus('thinking');
    setError(null);

    const SYSTEM_PROMPT = `Secara default, terjemahkan teks berikut antara Bahasa Indonesia dan Bahasa Inggris (jika input Indonesia terjemahkan ke English, dan sebaliknya). 
Pilih terjemahan yang paling natural dan paling sering dipakai oleh penutur asli (native).
JANGAN menambahkan teks pengantar, obrolan, atau penjelasan. 
PASTIKAN patuh secara ketat pada format output berikut (langsung terjemahannya saja):
1. Direct: [terjemahan harfiah]
2. natural: [terjemahan paling natural/native]
3. formal: [terjemahan formal/sopan]`;

    const AGENT_SYSTEM_PROMPT = `Kamu adalah agen AI yang memiliki kemampuan untuk berinteraksi dengan sistem file. Kamu dapat:
1. Membaca file menggunakan perintah "/read <path_file>"
2. Menulis file menggunakan perintah "/write <path_file> <content>"
3. Melihat isi direktori menggunakan perintah "/ls <path_dir>"
4. Mengetahui direktori kerja saat ini menggunakan perintah "/pwd"

Jika pengguna meminta untuk melihat isi direktori, membaca file, atau menulis file, JAWABLAH DENGAN HANYA MENGELUARKAN PERINTAH TERSEBUT pada baris pertama (misalnya "/ls ." atau "/pwd"). Sistem akan mengeksekusinya untukmu dan memberikan hasilnya untuk kamu simpulkan.`;

    let currentApiMessages = [
      ...(appMode === 'translator' ? [{ role: 'system' as const, content: SYSTEM_PROMPT }] : []),
      ...(appMode === 'agent' ? [{ role: 'system' as const, content: AGENT_SYSTEM_PROMPT }] : []),
      ...messages
        .filter(m => m.role !== 'system')
        .map(m => ({ role: m.role, content: m.content })),
      { role: 'user' as const, content: trimmed },
    ];

    try {
      let isAgentTurn = true;
      while (isAgentTurn) {
        addMessage('assistant', '');
        
        const generator = streamChatCompletion(currentApiMessages, activeModel, storeEnableThinking);
        let fullResponse = '';

        for await (const chunk of generator) {
          fullResponse += chunk;
          updateLastMessage(fullResponse);
        }

        const glowFormatted = renderMarkdownWithGlow(fullResponse);
        updateLastMessage(fullResponse, glowFormatted);

        // Implicit agent execution
        if (appMode === 'agent') {
          const firstLine = fullResponse.trim().split('\n')[0].trim();
          if (firstLine.startsWith('/')) {
            const cmdResult = executeCommandLocally(firstLine);
            if (cmdResult) {
              addMessage('system', `[Menjalankan ${firstLine}...]\n${cmdResult.output}`);
              currentApiMessages.push({ role: 'assistant', content: fullResponse });
              currentApiMessages.push({ role: 'user', content: `[Hasil Sistem]:\n${cmdResult.output}\n\nLanjutkan menjawab pengguna berdasarkan hasil ini.` });
              setStatus('calling_tool');
              continue;
            }
          }
        }
        
        // End interaction
        isAgentTurn = false;
        setConnectionStatus('connected');
        setStatus('complete');
      }
    } catch (err: any) {
      setStatus('error');
      if (err.message.includes('internet') || err.message.includes('koneksi') || err.message.includes('putus')) {
        setConnectionStatus('disconnected');
      }
      const errMsg = err.message || 'Terjadi kesalahan sistem.';
      setError(errMsg);
      updateLastMessage(`Error: ${errMsg}`);
    }
  };

  if (!modelSelected) {
    return (
      <ModelSelector 
        onSelect={(model) => {
          setActiveModel(model);
          saveLastModel(model);
          setModelSelected(true);
          if (messages.length > 0) {
            addMessage('system', `Model aktif diubah ke: ${model}`);
          }
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
          addMessage('system', `Aplikasi beralih ke mode: ${mode.toUpperCase()}`);
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
        <ChatView messages={messages} />
      </Box>

      <StatusBar status={status} tokenCount={totalTokens} enableThinking={storeEnableThinking} />
      
      <InputBar
        onSubmit={handleSubmit}
        onClearScreen={handleClearScreen}
        status={status}
      />
    </Box>
  );
};
