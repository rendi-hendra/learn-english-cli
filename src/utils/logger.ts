import fs from "fs";
import path from "path";

/**
 * Structured Logger for AI CLI Terminal.
 * Logs application events, warnings, errors, and debugging information to a persistent file.
 */
export class Logger {
  private static logFilePath = path.join(process.cwd(), "logs", "app.log");

  private static ensureLogDir() {
    const dir = path.dirname(Logger.logFilePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  }

  private static writeLog(level: string, msg: string, context?: any) {
    try {
      Logger.ensureLogDir();
      const timestamp = new Date().toISOString();
      const contextStr = context ? ` | Context: ${JSON.stringify(context)}` : "";
      const logLine = `[${timestamp}] [${level}] ${msg}${contextStr}\n`;
      fs.appendFileSync(Logger.logFilePath, logLine, "utf8");
    } catch (e) {
      // Fallback silently or output to stderr if logging fails
    }
  }

  static info(msg: string, context?: any) {
    this.writeLog("INFO", msg, context);
  }

  static warn(msg: string, context?: any) {
    this.writeLog("WARN", msg, context);
  }

  static error(msg: string, error?: Error, context?: any) {
    const errCtx = {
      ...context,
      error: error
        ? { name: error.name, message: error.message, stack: error.stack }
        : undefined,
    };
    this.writeLog("ERROR", msg, errCtx);
  }

  static debug(msg: string, context?: any) {
    // Only log debug logs if active
    if (process.env.DEBUG === "true" || process.env.NODE_ENV === "development") {
      this.writeLog("DEBUG", msg, context);
    }
  }
}
