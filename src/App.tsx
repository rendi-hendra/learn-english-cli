import React, { useEffect } from 'react';
import { Box } from 'ink';
import { useChatStore } from './store/chatStore.js';
import { Header } from './components/Header.js';
import { ChatView } from './components/ChatView.js';
import { StatusBar } from './components/StatusBar.js';
import { InputBar } from './components/InputBar.js';
import { streamChatCompletion } from './services/openai.js';
import { renderMarkdownWithGlow } from './utils/markdown.js';

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
    clearChat,
  } = useChatStore();

  // Set initial model if provided via CLI
  useEffect(() => {
    if (initialModel) {
      setActiveModel(initialModel);
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

    // Handle commands
    if (trimmed.startsWith('/')) {
      const parts = trimmed.split(' ');
      const command = parts[0];
      const args = parts.slice(1).join(' ').trim();

      switch (command) {
        case '/exit':
          process.exit(0);
          break;

        case '/clear':
          clearChat();
          // Print system message confirming deletion
          addMessage('system', 'Riwayat obrolan telah dibersihkan.');
          break;

        case '/help':
          addMessage(
            'system',
            `Bantuan AI CLI:\n` +
            `• /help                 - Menampilkan pesan bantuan ini\n` +
            `• /clear                - Menghapus riwayat obrolan\n` +
            `• /model [nama_model]   - Menampilkan atau mengubah model aktif (contoh: /model gpt-3.5-turbo)\n` +
            `• /exit                 - Keluar dari aplikasi\n` +
            `• Ctrl+L                - Membersihkan layar terminal\n` +
            `• Ctrl+C                - Keluar dari aplikasi`
          );
          break;

        case '/model':
          if (args) {
            setActiveModel(args);
            addMessage('system', `Model berhasil diubah ke: ${args}`);
          } else {
            addMessage('system', `Model aktif saat ini: ${activeModel}`);
          }
          break;

        default:
          addMessage('system', `Perintah tidak dikenal: ${command}. Ketik /help untuk melihat bantuan.`);
          break;
      }
      return;
    }

    // Add user message to state
    addMessage('user', trimmed);
    setStatus('thinking');
    setError(null);

    // Prepare API history (need to pass previous context)
    // Construct local array to send, to bypass async state update lag
    const SYSTEM_PROMPT = `Secara default, terjemahkan teks berikut antara Bahasa Indonesia dan Bahasa Inggris (jika input Indonesia terjemahkan ke English, dan sebaliknya). 
Pilih terjemahan yang paling natural dan paling sering dipakai oleh penutur asli (native).
JANGAN menambahkan teks pengantar, obrolan, atau penjelasan. 
PASTIKAN patuh secara ketat pada format output berikut (langsung terjemahannya saja):
1. Direct: [terjemahan harfiah]
2. natural: [terjemahan paling natural/native]
3. formal: [terjemahan formal/sopan]`;

    const apiMessages = [
      { role: 'system' as const, content: SYSTEM_PROMPT },
      ...messages
        .filter(m => m.role !== 'system') // Filter out local CLI system messages
        .map(m => ({ role: m.role, content: m.content })),
      { role: 'user' as const, content: trimmed },
    ];

    try {
      // Create empty assistant message placeholder to stream into
      addMessage('assistant', '');
      
      const generator = streamChatCompletion(apiMessages, activeModel, storeEnableThinking);
      let fullResponse = '';

      for await (const chunk of generator) {
        fullResponse += chunk;
        updateLastMessage(fullResponse);
      }

      // Format the final completed message with Glow
      const glowFormatted = renderMarkdownWithGlow(fullResponse);
      updateLastMessage(fullResponse, glowFormatted);

      setConnectionStatus('connected');
      setStatus('complete');
    } catch (err: any) {
      setStatus('error');
      
      // Update connection status on connectivity failure
      if (
        err.message.includes('internet') ||
        err.message.includes('koneksi') ||
        err.message.includes('putus')
      ) {
        setConnectionStatus('disconnected');
      }

      const errMsg = err.message || 'Terjadi kesalahan sistem.';
      setError(errMsg);
      updateLastMessage(`Error: ${errMsg}`);
    }
  };

  return (
    <Box flexDirection="column" padding={1}>
      <Header
        model={activeModel}
        messageCount={messageCount}
        connectionStatus={connectionStatus}
        status={status}
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
