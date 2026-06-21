import { routeUserCommand } from "./langchain.js";
import { Logger } from "../utils/logger.js";

export interface AgentRoutingResult {
  type: "command" | "chat" | "error";
  command?: string;
  reason?: string;
}

/**
 * Routes the agent request explicitly, deciding whether to run a local command
 * or fallback to regular chat. Includes detailed logging and clear execution paths.
 *
 * @param userInput The raw input typed by the user.
 * @param model The name of the active AI model.
 * @returns A structured AgentRoutingResult object.
 */
export async function routeAgentRequest(
  userInput: string,
  model: string
): Promise<AgentRoutingResult> {
  Logger.info("Memulai routing agent", { userInput, model });
  try {
    const routeResult = await routeUserCommand(userInput, model);
    Logger.debug("Hasil route model", { routeResult });

    if (routeResult.startsWith("/")) {
      Logger.info("Agent me-rute permintaan ke perintah lokal", { command: routeResult });
      return {
        type: "command",
        command: routeResult,
      };
    }

    Logger.info("Agent me-rute permintaan ke chat biasa (fallback)");
    return {
      type: "chat",
      reason: "Model did not return a local file system command",
    };
  } catch (err: any) {
    Logger.error("Gagal melakukan routing agent", err, { userInput, model });
    return {
      type: "error",
      reason: err.message || "Gagal merutekan perintah agent.",
    };
  }
}
