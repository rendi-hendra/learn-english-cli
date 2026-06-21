import { useChatStore } from "../store/chatStore.js";
import { streamLangChainChat, routeUserCommand } from "../services/langchain.js";
import { executeCommandLocally } from "../utils/commandExecutor.js";
import { renderMarkdownWithGlow } from "../utils/markdown.js";
import { AppError } from "../utils/errors.js";

export function useAgentMode() {
  const {
    activeModel,
    enableThinking,
    apiHistory,
    updateAssistantMessage,
    updateSystemMessage,
    setStatus,
    setError,
    setConnectionStatus,
  } = useChatStore();

  const handleAgent = async (sanitizedInput: string) => {
    setStatus("thinking");
    setError(null);

    try {
      let fullResponse = "";
      updateAssistantMessage("Menganalisis permintaan...");
      const routeResult = await routeUserCommand(sanitizedInput, activeModel);

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

      // Fallback to regular chat
      const currentApiMessages = [
        ...apiHistory.map((m: any) => ({ role: m.role as any, content: m.content })),
        { role: "user" as const, content: sanitizedInput },
      ];

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
      if (AppError.isNetworkError(err)) {
        setConnectionStatus("disconnected");
      }
      const errMsg = err.message || "Terjadi kesalahan sistem.";
      setError(errMsg);
      updateAssistantMessage(`Error: ${errMsg}`);
    }
  };

  return { handleAgent };
}
