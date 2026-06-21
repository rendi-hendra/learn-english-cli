import fs from 'fs';
import path from 'path';
import { InputValidator } from './validation.js';

export interface CommandResult {
  output: string;
  success: boolean;
}

export function executeCommandLocally(trimmedCmd: string): CommandResult | null {
  const parts = trimmedCmd.split(' ');
  const command = parts[0];
  const args = parts.slice(1).join(' ').trim();

  switch (command) {
    case '/read': {
      if (!args) {
        return { output: 'Penggunaan: /read <path_file>', success: false };
      }
      try {
        const sanitized = InputValidator.sanitizePath(args);
        const filePath = path.resolve(process.cwd(), sanitized);
        const content = fs.readFileSync(filePath, 'utf8');
        const ext = path.extname(filePath).slice(1).toLowerCase() || 'text';
        const isMarkdown = ['md', 'markdown', 'mdx'].includes(ext);
        
        let outputContent = content;
        if (!isMarkdown) {
          outputContent = `\`\`\`${ext}\n${content}\n\`\`\``;
        }

        return { 
          output: `Membaca file: ${sanitized}\n\n${outputContent}`, 
          success: true
        };
      } catch (err: any) {
        return { output: `Gagal membaca file: ${err.message}`, success: false };
      }
    }

    case '/write': {
      if (parts.length < 3) {
        return { output: 'Penggunaan: /write <path_file> <content>', success: false };
      }
      const filePath = parts[1];
      const content = parts.slice(2).join(' ');
      try {
        const sanitized = InputValidator.sanitizePath(filePath);
        const fullPath = path.resolve(process.cwd(), sanitized);
        const dirPath = path.dirname(fullPath);
        if (!fs.existsSync(dirPath)) {
          fs.mkdirSync(dirPath, { recursive: true });
        }
        fs.writeFileSync(fullPath, content, 'utf8');
        return { output: `File berhasil ditulis: ${fullPath}`, success: true };
      } catch (err: any) {
        return { output: `Gagal menulis file: ${err.message}`, success: false };
      }
    }

    case '/ls': {
      const dirPath = args || '.';
      try {
        const sanitized = InputValidator.sanitizePath(dirPath);
        const fullPath = path.resolve(process.cwd(), sanitized);
        const items = fs.readdirSync(fullPath);
        const stat = fs.statSync(fullPath);
        if (!stat.isDirectory()) {
          return { output: `"${sanitized}" bukan sebuah direktori.`, success: false };
        }
        
        const itemList = items.map(item => {
          const itemPath = path.join(fullPath, item);
          const itemStat = fs.statSync(itemPath);
          return `${itemStat.isDirectory() ? '📁' : '📄'} ${item}`;
        }).join('\n');
        
        return { output: `Isi direktori "${sanitized}":\n${itemList}`, success: true };
      } catch (err: any) {
        return { output: `Gagal membaca direktori: ${err.message}`, success: false };
      }
    }

    case '/pwd': {
      return { output: `Direktori kerja saat ini: ${process.cwd()}`, success: true };
    }

    default:
      return null; // Not a filesystem command
  }
}
