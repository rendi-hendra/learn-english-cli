import React from 'react';
import { render } from 'ink';
import { Command } from 'commander';
import { App } from './App.js';
import dotenv from 'dotenv';
import { getLastModel } from './utils/modelConfig.js';

// Load environmental variables
dotenv.config();

const program = new Command();

program
  .name('ai-cli')
  .description('Modern terminal TUI interface for OpenAI models built with React Ink')
  .version('1.0.0')
  .option('-m, --model <model>', 'OpenAI model to use', getLastModel())
  .option('-t, --thinking', 'Enable thinking/reasoning mode', false)
  .parse(process.argv);

const options = program.opts();

// Start with a clean console
console.clear();

// Render React Ink application
const { waitUntilExit } = render(
  <App initialModel={options.model} enableThinking={!!options.thinking} />
);

waitUntilExit().catch((err) => {
  console.error('Application error:', err);
  process.exit(1);
});
