import { describe, it, expect, vi, beforeEach } from "vitest";
import { InputValidator, ValidationRules } from "../validation.js";

describe("InputValidator", () => {
  const rules: ValidationRules = {
    maxInputLength: 50,
    allowedCommands: ["/read", "/write", "/help"],
    allowedModels: ["gpt-4o", "qwen-max"],
  };

  beforeEach(() => {
    // Reset private lastRequestTime to avoid test interference from rate limiting
    (InputValidator as any).lastRequestTime = 0;
  });

  it("should validate input length successfully", () => {
    const input = "a".repeat(51);
    const result = InputValidator.validateUserInput(input, rules);
    expect(result.isValid).toBe(false);
    expect(result.error).toContain("Input too long");
  });

  it("should block inputs on rate limiting cooldown", () => {
    const validResult = InputValidator.validateUserInput("hello", rules);
    expect(validResult.isValid).toBe(true);

    const rateLimitedResult = InputValidator.validateUserInput("world", rules);
    expect(rateLimitedResult.isValid).toBe(false);
    expect(rateLimitedResult.error).toContain("sending requests too quickly");
  });

  it("should block invalid command formats", () => {
    const result = InputValidator.validateUserInput("/delete file.txt", rules);
    expect(result.isValid).toBe(false);
    expect(result.error).toContain("Unknown command");
  });

  it("should check allowed model names case-insensitively", () => {
    expect(InputValidator.validateModel("GPT-4o", rules.allowedModels)).toBe(true);
    expect(InputValidator.validateModel("qwen-max", rules.allowedModels)).toBe(true);
    expect(InputValidator.validateModel("claude-opus", rules.allowedModels)).toBe(false);
  });

  it("should sanitize file paths by stripping traversal patterns", () => {
    const dirtyPath = "../../etc/passwd";
    const cleanPath = InputValidator.sanitizePath(dirtyPath);
    expect(cleanPath).not.toContain("..");
    expect(cleanPath).toBe("/etc/passwd");
  });
});
