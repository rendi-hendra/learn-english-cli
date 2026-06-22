#!/usr/bin/env node
import React from "react";
import { render } from "ink";
import { Command } from "commander";
import { App } from "./App.js";
import { getLastModel } from "./utils/modelConfig.js";
import { loadEnv } from "./utils/envConfig.js";

// Load environmental variables
loadEnv();

const program = new Command();

program
  .name("ai-cli")
  .description(
    "Modern terminal TUI interface for OpenAI models built with React Ink",
  )
  .version("1.0.0")
  .option("-m, --model <model>", "OpenAI model to use", getLastModel())
  .option("-t, --thinking", "Enable thinking/reasoning mode", false)
  .option("--clipboard", "Enable real-time clipboard monitoring for translator mode", false)
  .option("-clip", "Alias for --clipboard", false)
  .parse(process.argv);

const options = program.opts();
const rawArgs = process.argv.slice(2);
const enableClipboard = !!options.clipboard || rawArgs.includes('-clip') || rawArgs.includes('--clipboard');

// Clear the screen on startup for a clean look
process.stdout.write("\x1b[2J\x1b[H");

// Handle Ctrl+C explicitly at process level if ink misses it
process.on("SIGINT", () => {
  process.stdout.write("\x1b[?25h"); // Restore cursor visibility
  process.exit(0);
});
// Render React Ink application
const { waitUntilExit } = render(
  <App 
    initialModel={options.model} 
    enableThinking={!!options.thinking} 
    enableClipboard={enableClipboard}
  />,
);

waitUntilExit()
  .then(() => {
    process.exit(0);
  })
  .catch((err) => {
    process.stdout.write("\x1b[?25h"); // Restore cursor visibility
    console.error("Application error:", err);
    process.exit(1);
  });
