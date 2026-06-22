import { useChatStore } from "../store/chatStore.js";
import { streamLangChainChat } from "../services/langchain.js";
import { renderMarkdownWithGlow } from "../utils/markdown.js";
import { AppError } from "../utils/errors.js";

export function useTranslatorMode() {
  const {
    activeModel,
    enableThinking,
    appMode,
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
      // Ensure appMode is one of the supported modes for streamLangChainChat
      const mode = (appMode === "translator-clipboard" ? "translator-clipboard" : "translator");
      const generator = streamLangChainChat(
        currentApiMessages,
        activeModel,
        enableThinking,
        mode
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
      if (AppError.isNetworkError(err)) {
        setConnectionStatus("disconnected");
      }
      const errMsg = err.message || "Terjadi kesalahan sistem.";
      setError(errMsg);
      updateAssistantMessage(`Error: ${errMsg}`);
    }
  };

  return { handleTranslate };
}
