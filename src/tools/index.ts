import { DynamicStructuredTool } from "@langchain/core/tools";
import { z } from "zod";
import fs from "fs";
import path from "path";
import { SimpleFilesystemMcpServer } from "../services/simpleMcpServer.js";

// Use the MCP server as a local library (no subprocess needed)
const mcpServer = new SimpleFilesystemMcpServer(process.cwd());

export const readTool = new DynamicStructuredTool({
  name: "read_file",
  description: "Reads the content of a file from the local file system. Use this to inspect code, markdown, or any text file.",
  schema: z.object({
    filePath: z.string().describe("The relative or absolute path to the file to read"),
  }),
  func: async ({ filePath }) => {
    try {
      const fullPath = mcpServer.resolvePath(filePath.trim());
      const content = fs.readFileSync(fullPath, 'utf8');
      const ext = path.extname(fullPath).slice(1).toLowerCase() || 'text';
      const isMarkdown = ['md', 'markdown', 'mdx'].includes(ext);

      let outputContent = content;
      if (!isMarkdown) {
        outputContent = `\`\`\`${ext}\n${content}\n\`\`\``;
      }
      return `Membaca file: ${filePath.trim()}\n\n${outputContent}`;
    } catch (err: any) {
      return `Gagal membaca file: ${err.message}`;
    }
  },
});

export const writeTool = new DynamicStructuredTool({
  name: "write_file",
  description: "Writes content to a file in the local file system. It will create directories if they don't exist.",
  schema: z.object({
    filePath: z.string().describe("The relative or absolute path to the file to write"),
    content: z.string().describe("The content to write into the file"),
  }),
  func: async ({ filePath, content }) => {
    try {
      const fullPath = mcpServer.resolvePath(filePath.trim());
      const dirPath = path.dirname(fullPath);
      if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
      }
      fs.writeFileSync(fullPath, content, 'utf8');
      return `File berhasil ditulis: ${fullPath}`;
    } catch (err: any) {
      return `Gagal menulis file: ${err.message}`;
    }
  },
});

export const lsTool = new DynamicStructuredTool({
  name: "list_directory",
  description: "Lists the contents of a directory in the local file system.",
  schema: z.object({
    dirPath: z.string().describe("The relative or absolute path to the directory to list. Defaults to '.'"),
  }),
  func: async ({ dirPath }) => {
    const targetPath = dirPath || '.';
    try {
      const fullPath = mcpServer.resolvePath(targetPath);
      const stat = fs.statSync(fullPath);
      if (!stat.isDirectory()) {
        return `"${targetPath}" bukan sebuah direktori.`;
      }

      const items = fs.readdirSync(fullPath);
      const itemList = items.map(item => {
        const itemPath = path.join(fullPath, item);
        let isDir = false;
        try {
          isDir = fs.statSync(itemPath).isDirectory();
        } catch (_e) {}
        return `${isDir ? '📁' : '📄'} ${item}`;
      }).join('\n');

      return `Isi direktori "${targetPath}":\n${itemList}`;
    } catch (err: any) {
      return `Gagal membaca direktori: ${err.message}`;
    }
  },
});

export const pwdTool = new DynamicStructuredTool({
  name: "get_current_directory",
  description: "Gets the current working directory.",
  schema: z.object({}),
  func: async () => {
    return `Direktori kerja saat ini: ${process.cwd()}`;
  },
});

export const fsTools = [readTool, writeTool, lsTool, pwdTool];
