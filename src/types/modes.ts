export interface ModeHandler {
  handleSubmit(input: string): Promise<void>;
  handleClearScreen(): void;
}

export interface TranslatorModeConfig {
  maxInputLength: number;
  allowedCommands: string[];
  allowedModels: string[];
}
