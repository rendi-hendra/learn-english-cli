import { useChatStore } from "../store/chatStore.js";
import { streamLangChainChat } from "../services/langchain.js";
import { renderMarkdownWithGlow } from "../utils/markdown.js";

export function useChatMode() {
  const {
    activeModel,
    enableThinking,
    apiHistory,
    updateAssistantMessage,
    setStatus,
    setError,
    setConnectionStatus,
  } = useChatStore();

  const handleChat = async (sanitizedInput: string) => {
    setStatus("thinking");
    setError(null);

    const currentApiMessages = [
      ...apiHistory.map((m: any) => ({ role: m.role as any, content: m.content })),
      { role: "user" as const, content: sanitizedInput },
    ];

    try {
      let fullResponse = "";
      const generator = streamLangChainChat(
        currentApiMessages,
        activeModel,
        enableThinking,
        "chat"
      );

      for await (const chunk of generator) {
        fullResponse += chunk;
        updateAssistantMessage(fullResponse);
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

  return { handleChat };
}
