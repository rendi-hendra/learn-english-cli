import { describe, it, expect, beforeEach, vi } from "vitest";
import { getLangChainModel } from "../modelManager.js";
import { AppError, ErrorCode } from "../../utils/errors.js";

describe("ModelManager", () => {
  beforeEach(() => {
    vi.stubEnv("OPENAI_API_KEY", "test-api-key");
  });

  it("should throw INVALID_MODEL AppError when modelName is empty", () => {
    expect(() => getLangChainModel("", false)).toThrowError(
      new AppError(ErrorCode.INVALID_MODEL, "Model name must be a valid string.")
    );
  });

  it("should throw API_KEY_MISSING AppError when api key is not set", () => {
    vi.stubEnv("OPENAI_API_KEY", "");
    expect(() => getLangChainModel("gpt-4o", false)).toThrowError(
      new AppError(
        ErrorCode.API_KEY_MISSING,
        "OpenAI API Key is missing. Please set OPENAI_API_KEY in your .env file."
      )
    );
  });

  it("should cache model instance", () => {
    const model1 = getLangChainModel("gpt-4o", false);
    const model2 = getLangChainModel("gpt-4o", false);
    expect(model1).toBe(model2);
  });
});
