export enum ErrorCode {
  API_KEY_MISSING = "API_KEY_MISSING",
  NETWORK_ERROR = "NETWORK_ERROR",
  INVALID_MODEL = "INVALID_MODEL",
  FILE_NOT_FOUND = "FILE_NOT_FOUND",
  RATE_LIMIT = "RATE_LIMIT",
  INVALID_INPUT = "INVALID_INPUT",
}

export class AppError extends Error {
  constructor(
    public code: ErrorCode,
    message: string,
    public context?: Record<string, any>
  ) {
    super(message);
    this.name = "AppError";
  }

  /**
   * Helper to check if an unknown error is network related.
   */
  static isNetworkError(err: any): boolean {
    if (err instanceof AppError) {
      return err.code === ErrorCode.NETWORK_ERROR;
    }
    const msg = String(err?.message || "").toLowerCase();
    return (
      msg.includes("internet") ||
      msg.includes("koneksi") ||
      msg.includes("putus") ||
      msg.includes("fetch") ||
      msg.includes("network") ||
      msg.includes("econnrefused") ||
      msg.includes("enotfound")
    );
  }
}
