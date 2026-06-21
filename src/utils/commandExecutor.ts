import fs from 'fs';
import path from 'path';
import { InputValidator } from './validation.js';
import { Logger } from './logger.js';

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

        if (!fs.existsSync(filePath)) {
          Logger.warn(`Pembacaan file gagal: file tidak ditemukan`, { path: sanitized });
          return { output: `Gagal membaca file: File tidak ditemukan di ${sanitized}`, success: false };
        }

        const stats = fs.statSync(filePath);
        const MAX_FILE_SIZE_MB = 10;
        const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

        if (stats.size > MAX_FILE_SIZE_BYTES) {
          Logger.warn(`Pembacaan file ditolak: file terlalu besar`, { path: sanitized, sizeBytes: stats.size });
          return {
            output: `File terlalu besar. Maksimal batas ukuran file yang dapat dibaca adalah ${MAX_FILE_SIZE_MB}MB`,
            success: false,
          };
        }

        const content = fs.readFileSync(filePath, 'utf8');
        const ext = path.extname(filePath).slice(1).toLowerCase() || 'text';
        const isMarkdown = ['md', 'markdown', 'mdx'].includes(ext);
        
        let outputContent = content;
        if (!isMarkdown) {
          outputContent = `\`\`\`${ext}\n${content}\n\`\`\``;
        }

        Logger.info(`Membaca file sukses`, { path: sanitized, sizeBytes: stats.size });
        return { 
          output: `Membaca file: ${sanitized}\n\n${outputContent}`, 
          success: true
        };
      } catch (err: any) {
        Logger.error(`Gagal mengeksekusi /read`, err, { args });
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
        Logger.info(`Menulis file sukses`, { path: sanitized });
        return { output: `File berhasil ditulis: ${fullPath}`, success: true };
      } catch (err: any) {
        Logger.error(`Gagal mengeksekusi /write`, err, { filePath });
        return { output: `Gagal menulis file: ${err.message}`, success: false };
      }
    }

    case '/ls': {
      const dirPath = args || '.';
      try {
        const sanitized = InputValidator.sanitizePath(dirPath);
        const fullPath = path.resolve(process.cwd(), sanitized);

        if (!fs.existsSync(fullPath)) {
          Logger.warn(`Membaca direktori gagal: direktori tidak ditemukan`, { path: sanitized });
          return { output: `Gagal membaca direktori: Direktori tidak ditemukan di ${sanitized}`, success: false };
        }

        const stat = fs.statSync(fullPath);
        if (!stat.isDirectory()) {
          return { output: `"${sanitized}" bukan sebuah direktori.`, success: false };
        }

        const items = fs.readdirSync(fullPath);
        const itemList = items.map(item => {
          const itemPath = path.join(fullPath, item);
          const itemStat = fs.statSync(itemPath);
          return `${itemStat.isDirectory() ? '📁' : '📄'} ${item}`;
        }).join('\n');
        
        Logger.info(`Membaca direktori sukses`, { path: sanitized });
        return { output: `Isi direktori "${sanitized}":\n${itemList}`, success: true };
      } catch (err: any) {
        Logger.error(`Gagal mengeksekusi /ls`, err, { dirPath });
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
