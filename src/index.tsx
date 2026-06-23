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
  .parse(process.argv);

const options = program.opts();

// Clear the screen on startup for a clean look
process.stdout.write("\x1b[2J\x1b[H");

// Clear screen on resize to prevent duplicated UI when terminal is resized
process.stdout.on("resize", () => {
  process.stdout.write("\x1b[2J\x1b[H");
});

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
