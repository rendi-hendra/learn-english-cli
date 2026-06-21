import chalk from 'chalk';
import { marked } from 'marked';
import { highlight } from 'cli-highlight';
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

export function decodeHtmlEntities(str: string): string {
  if (!str) return '';
  return str
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'");
}

export function renderInlineToken(token: any): string {
  switch (token.type) {
    case 'strong':
      return chalk.bold(renderInlineTokens(token.tokens || [{ type: 'text', text: token.text }]));
    case 'em':
      return chalk.italic(renderInlineTokens(token.tokens || [{ type: 'text', text: token.text }]));
    case 'codespan':
      return chalk.yellow(`\`${token.text}\``);
    case 'link':
      return chalk.cyan.underline(token.text) + chalk.gray(` (${token.href})`);
    case 'text':
      return decodeHtmlEntities(token.text);
    default:
      return decodeHtmlEntities(token.text || '');
  }
}

export function renderInlineTokens(tokens: any[] | undefined): string {
  if (!tokens) return '';
  return tokens.map(renderInlineToken).join('');
}

export function renderMarkdown(markdown: string): string {
  if (!markdown) return '';
  try {
    const tokens = marked.lexer(markdown);
    return tokens
      .map(token => {
        switch (token.type) {
          case 'heading': {
            const content = renderInlineTokens(token.tokens);
            if (token.depth === 1) {
              return chalk.cyan.bold.underline(content);
            } else if (token.depth === 2) {
              return chalk.blue.bold(content);
            } else {
              return chalk.magenta.bold(content);
            }
          }
          case 'paragraph': {
            return renderInlineTokens(token.tokens);
          }
          case 'list': {
            return token.items.map((item: any, idx: number) => {
              const prefix = token.ordered ? `${idx + 1}. ` : '• ';
              let content = '';
              if (item.tokens) {
                content = item.tokens.map((t: any) => {
                  if (t.type === 'text' || t.type === 'paragraph') {
                    return renderInlineTokens(t.tokens || [{ type: 'text', text: t.text }]);
                  }
                  return t.text || '';
                }).join(' ');
              } else {
                content = item.text;
              }
              return `  ${chalk.green(prefix)}${content}`;
            }).join('\n');
          }
          case 'code': {
            const language = token.lang || 'text';
            let highlighted = '';
            try {
              highlighted = highlight(token.text, { language, ignoreIllegals: true });
            } catch (e) {
              highlighted = token.text;
            }
            const lines = highlighted.split('\n');
            const header = chalk.gray(`┌── ${chalk.yellow(language)} ──────────────────────────────────────`);
            const footer = chalk.gray('└' + '─'.repeat(50));
            const indentedLines = lines.map(line => `${chalk.gray('│')} ${line}`).join('\n');
            return `${header}\n${indentedLines}\n${footer}`;
          }
          case 'space':
            return '';
          default:
            return (token.raw || '').trim();
        }
      })
      .filter(block => block !== undefined && block !== '')
      .join('\n\n');
  } catch (err) {
    return markdown;
  }
}

let cachedGlowPath: string | null | undefined = undefined;

function findGlowPath(): string | null {
  if (cachedGlowPath !== undefined) return cachedGlowPath;

  // 1. Try directly from PATH
  try {
    execSync('glow --version', { stdio: 'ignore' });
    cachedGlowPath = 'glow';
    return cachedGlowPath;
  } catch (e) {
    // ignore
  }

  // 2. Check AppData local Microsoft WinGet Packages
  try {
    const userProfile = process.env.USERPROFILE || '';
    if (userProfile) {
      const wingetDir = path.join(userProfile, 'AppData', 'Local', 'Microsoft', 'WinGet', 'Packages');
      if (fs.existsSync(wingetDir)) {
        const dirs = fs.readdirSync(wingetDir);
        for (const dir of dirs) {
          if (dir.toLowerCase().includes('charmbracelet.glow')) {
            const glowSubDir = path.join(wingetDir, dir);
            const subdirs = fs.readdirSync(glowSubDir);
            for (const subdir of subdirs) {
              const fullSubpath = path.join(glowSubDir, subdir);
              if (fs.statSync(fullSubpath).isDirectory()) {
                const exePath = path.join(fullSubpath, 'glow.exe');
                if (fs.existsSync(exePath)) {
                  cachedGlowPath = exePath;
                  return cachedGlowPath;
                }
              }
            }
            const exePathDirect = path.join(glowSubDir, 'glow.exe');
            if (fs.existsSync(exePathDirect)) {
              cachedGlowPath = exePathDirect;
              return cachedGlowPath;
            }
          }
        }
      }
    }
  } catch (err) {
    // ignore
  }

  cachedGlowPath = null;
  return null;
}

export function renderMarkdownWithGlow(markdown: string): string {
  const glowPath = findGlowPath();
  if (glowPath) {
    try {
      // Get terminal width dynamically, fallback to 80, and subtract padding for Ink TUI borders
      const cols = process.stdout.columns || 80;
      const targetWidth = Math.max(40, cols - 8);
      
      const output = execSync(`"${glowPath}" -s dark -w ${targetWidth} -`, {
        input: markdown,
        encoding: 'utf8',
        stdio: ['pipe', 'pipe', 'ignore'],
      });
      
      // Strip any leading markdown header symbols (e.g. #, ##, ###) while preserving colors/indentation
      let cleaned = output.trimEnd();
      
      // Remove any leading empty lines that Glow might add, carefully preserving ANSI color codes
      while (cleaned.match(/^((?:\x1B\[[0-9;]*[a-zA-Z])*)[ \t]*[\r\n]+/)) {
        cleaned = cleaned.replace(/^((?:\x1B\[[0-9;]*[a-zA-Z])*)[ \t]*[\r\n]+/, '$1');
      }
      cleaned = cleaned.replace(/^((?:[ \t]|\u001b\[[0-9;]*m)*)#+[ \t]*/gm, '$1');
      return cleaned;
    } catch (err) {
      // Fallback to built-in renderer
    }
  }
  return renderMarkdown(markdown);
}
