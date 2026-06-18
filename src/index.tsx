#!/usr/bin/env node
import React from 'react';
import { render } from 'ink';
import { Command } from 'commander';
import { App } from './App.js';
import { getLastModel } from './utils/modelConfig.js';
import { loadEnv } from './utils/envConfig.js';

// Load environmental variables
loadEnv();

const program = new Command();

program
  .name('ai-cli')
  .description('Modern terminal TUI interface for OpenAI models built with React Ink')
  .version('1.0.0')
  .option('-m, --model <model>', 'OpenAI model to use', getLastModel())
  .option('-t, --thinking', 'Enable thinking/reasoning mode', false)
  .parse(process.argv);

const options = program.opts();

// Setup alternate screen buffer to prevent scroll bug in CMD
const enterAltScreen = () => process.stdout.write('\x1b[?1049h');
const leaveAltScreen = () => process.stdout.write('\x1b[?1049l\x1b[?25h');

enterAltScreen();

// Ensure we clean up the terminal state on exit
process.on('exit', () => {
  leaveAltScreen();
});

// Handle Ctrl+C explicitly at process level if ink misses it
process.on('SIGINT', () => {
  leaveAltScreen();
  process.exit(0);
});
// Render React Ink application
const { waitUntilExit } = render(
  <App initialModel={options.model} enableThinking={!!options.thinking} />
);

waitUntilExit().then(() => {
  process.exit(0);
}).catch((err) => {
  leaveAltScreen();
  console.error('Application error:', err);
  process.exit(1);
});
