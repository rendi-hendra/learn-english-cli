export interface ValidationRules {
  maxInputLength: number;
  allowedCommands: string[];
  allowedModels: string[];
}

export interface ValidationResult {
  isValid: boolean;
  error?: string;
  sanitizedInput?: string;
}

export class InputValidator {
  private static lastRequestTime = 0;
  private static COOLDOWN_MS = 1000; // Rate limit: 1 request per second for local CLI

  /**
   * Validates user input length, rate limiting, and command format.
   */
  static validateUserInput(
    input: string,
    rules: ValidationRules
  ): ValidationResult {
    const trimmed = input.trim();

    // 1. Max input length validation
    if (trimmed.length > rules.maxInputLength) {
      return {
        isValid: false,
        error: `Input too long. Maximum ${rules.maxInputLength} characters allowed.`,
      };
    }

    // 2. Rate limiting check (cooldown)
    const now = Date.now();
    if (now - this.lastRequestTime < this.COOLDOWN_MS) {
      return {
        isValid: false,
        error: "You are sending requests too quickly. Please wait a moment.",
      };
    }
    this.lastRequestTime = now;

    // 3. Command validation (if input starts with "/")
    if (trimmed.startsWith("/")) {
      const parts = trimmed.split(" ");
      const command = parts[0];
      if (!rules.allowedCommands.includes(command)) {
        return {
          isValid: false,
          error: `Unknown command '${command}'. Type /help for available commands.`,
        };
      }
    }

    return {
      isValid: true,
      sanitizedInput: trimmed,
    };
  }

  /**
   * Validates if a model name is allowed.
   */
  static validateModel(model: string, allowedModels: string[]): boolean {
    if (!model || typeof model !== "string" || model.trim() === "") {
      return false;
    }
    // Perform case-insensitive match or match in array
    return allowedModels.some(
      (m) => m.toLowerCase() === model.trim().toLowerCase()
    );
  }

  /**
   * Sanitizes file paths to prevent directory traversal attacks (e.g., ../../)
   * and removes illegal character sequences.
   */
  static sanitizePath(filePath: string): string {
    if (!filePath) return "";

    // Normalize separators to forward slash
    let normalized = filePath.replace(/\\/g, "/");

    // Remove directory traversal tokens (like '..')
    normalized = normalized.replace(/\.\.+/g, "");

    // Extract drive letter if on Windows (e.g. C:)
    const hasDriveLetter = /^[a-zA-Z]:/.test(normalized);
    let drivePrefix = "";
    if (hasDriveLetter) {
      drivePrefix = normalized.slice(0, 2);
      normalized = normalized.slice(2);
    }

    // Remove illegal filesystem characters
    normalized = normalized.replace(/[<>:"|?*]/g, "");

    // Reconstruct path
    const sanitized = drivePrefix + normalized;
    
    // Trim spaces and clean duplicate slashes
    return sanitized.replace(/\/+/g, "/").trim();
  }
}
