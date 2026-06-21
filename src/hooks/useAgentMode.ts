import { useChatStore } from "../store/chatStore.js";
import { streamLangChainChat } from "../services/langchain.js";
import { executeCommandLocally } from "../utils/commandExecutor.js";
import { renderMarkdownWithGlow } from "../utils/markdown.js";
import { AppError } from "../utils/errors.js";
import { routeAgentRequest } from "../services/agentRouter.js";

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
      const routing = await routeAgentRequest(sanitizedInput, activeModel);

      if (routing.type === "command" && routing.command) {
        const cmdResult = executeCommandLocally(routing.command);
        if (cmdResult) {
          updateAssistantMessage(`Menjalankan perintah: ${routing.command}`);
          const formattedOutput = renderMarkdownWithGlow(cmdResult.output);
          updateSystemMessage(cmdResult.output, formattedOutput);
          setConnectionStatus("connected");
          setStatus("complete");
          return;
        }
      } else if (routing.type === "error") {
        throw new Error(routing.reason);
      }

      // Fallback to regular chat (routing.type === "chat")
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
