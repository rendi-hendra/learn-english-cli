import { useChatStore } from "../store/chatStore.js";
import { streamLangChainChat } from "../services/langchain.js";
import { renderMarkdownWithGlow } from "../utils/markdown.js";

export function useTranslatorMode() {
  const {
    activeModel,
    enableThinking,
    updateAssistantMessage,
    setStatus,
    setError,
    setConnectionStatus,
  } = useChatStore();

  const handleTranslate = async (sanitizedInput: string) => {
    setStatus("thinking");
    setError(null);

    const currentApiMessages = [{ role: "user" as const, content: sanitizedInput }];

    try {
      let fullResponse = "";
      const generator = streamLangChainChat(
        currentApiMessages,
        activeModel,
        enableThinking,
        "translator"
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

  return { handleTranslate };
}
