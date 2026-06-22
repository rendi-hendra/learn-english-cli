import { useChatStore } from "../store/chatStore.js";

export function useCommonCommands(
  onExitModeSelection: () => void,
  onExitModelSelection: () => void
) {
  const { clearChat, startConversation, updateSystemMessage } = useChatStore();

  const handleCommonCommand = (sanitized: string): boolean => {
    if (!sanitized.startsWith("/")) return false;

    const parts = sanitized.split(" ");
    const command = parts[0];

    if (command === "/exit") {
      process.exit(0);
    }
    if (command === "/clear") {
      clearChat();
      startConversation("/clear");
      updateSystemMessage("Riwayat obrolan telah dibersihkan.");
      return true;
    }
    if (command === "/help") {
      startConversation("/help");
      updateSystemMessage(
        `Bantuan AI CLI:\n• /help                 - Menampilkan pesan bantuan ini\n• /clear                - Menghapus riwayat obrolan\n• /read [path_file]     - Membaca isi file lokal ke dalam konteks obrolan\n• /write [path_file] [content] - Menulis konten ke file\n• /ls [path_dir]        - Menampilkan daftar isi direktori\n• /pwd                  - Menampilkan direktori kerja saat ini\n• /mode                 - Menampilkan menu interaktif untuk beralih mode\n• /model                - Menampilkan menu interaktif untuk memilih model\n• /exit                 - Keluar dari aplikasi\n• Ctrl+L                - Membersihkan layar terminal\n• Ctrl+C                - Keluar dari aplikasi`
      );
      return true;
    }
    if (command === "/mode") {
      onExitModeSelection();
      return true;
    }
    if (command === "/model") {
      onExitModelSelection();
      return true;
    }

    return false;
  };

  return { handleCommonCommand };
}
