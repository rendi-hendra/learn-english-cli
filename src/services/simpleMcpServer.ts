import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { CallToolRequestSchema, ListToolsRequestSchema } from "@modelcontextprotocol/sdk/types.js";

export class SimpleFilesystemMcpServer {
  private allowedRoot: string;
  private server: Server;

  constructor(allowedRoot: string = process.cwd()) {
    this.allowedRoot = path.resolve(allowedRoot);
    this.server = new Server(
      {
        name: "filesystem-server",
        version: "0.1.0",
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );
    this.setupHandlers();
  }

  resolvePath(inputPath: string): string {
    const resolvedPath = path.resolve(this.allowedRoot, inputPath);
    const relativePath = path.relative(this.allowedRoot, resolvedPath);
    if (relativePath.startsWith('..') || path.isAbsolute(relativePath)) {
      throw new Error(`Access denied: Path '${inputPath}' is outside the allowed root`);
    }
    return resolvedPath;
  }

  private setupHandlers() {
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      return {
        tools: [
          {
            name: "read_file",
            description: "Reads the content of a file from the local file system. Use this to inspect code, markdown, or any text file.",
            inputSchema: {
              type: "object",
              properties: {
                filePath: { type: "string", description: "The relative or absolute path to the file to read" },
              },
              required: ["filePath"],
            },
          },
          {
            name: "write_file",
            description: "Writes content to a file in the local file system. It will create directories if they don't exist.",
            inputSchema: {
              type: "object",
              properties: {
                filePath: { type: "string", description: "The relative or absolute path to the file to write" },
                content: { type: "string", description: "The content to write into the file" },
              },
              required: ["filePath", "content"],
            },
          },
          {
            name: "list_directory",
            description: "Lists the contents of a directory in the local file system.",
            inputSchema: {
              type: "object",
              properties: {
                dirPath: { type: "string", description: "The relative or absolute path to the directory to list. Defaults to '.'" },
              },
            },
          },
          {
            name: "get_current_directory",
            description: "Gets the current working directory.",
            inputSchema: {
              type: "object",
              properties: {},
            },
          }
        ],
      };
    });

    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      try {
        switch (request.params.name) {
          case "read_file": {
            const { filePath } = request.params.arguments as { filePath: string };
            const fullPath = this.resolvePath(filePath.trim());
            const content = fs.readFileSync(fullPath, 'utf8');
            const ext = path.extname(fullPath).slice(1).toLowerCase() || 'text';
            const isMarkdown = ['md', 'markdown', 'mdx'].includes(ext);
            let outputContent = content;
            if (!isMarkdown) {
              outputContent = `\`\`\`${ext}\n${content}\n\`\`\``;
            }
            return {
              content: [
                { type: "text", text: `Membaca file: ${filePath.trim()}\n\n${outputContent}` }
              ],
            };
          }
          case "write_file": {
            const { filePath, content } = request.params.arguments as { filePath: string, content: string };
            const fullPath = this.resolvePath(filePath.trim());
            const dirPath = path.dirname(fullPath);
            if (!fs.existsSync(dirPath)) {
              fs.mkdirSync(dirPath, { recursive: true });
            }
            fs.writeFileSync(fullPath, content, 'utf8');
            return {
              content: [
                { type: "text", text: `File berhasil ditulis: ${fullPath}` }
              ],
            };
          }
          case "list_directory": {
            const args = request.params.arguments as { dirPath?: string };
            const targetPath = args.dirPath || '.';
            const fullPath = this.resolvePath(targetPath);
            const stat = fs.statSync(fullPath);
            if (!stat.isDirectory()) {
              throw new Error(`"${targetPath}" bukan sebuah direktori.`);
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
            return {
              content: [
                { type: "text", text: `Isi direktori "${targetPath}":\n${itemList}` }
              ],
            };
          }
          case "get_current_directory": {
            return {
              content: [
                { type: "text", text: `Direktori kerja saat ini: ${process.cwd()}` }
              ],
            };
          }
          default:
            throw new Error(`Unknown tool: ${request.params.name}`);
        }
      } catch (error: any) {
        return {
          isError: true,
          content: [
            { type: "text", text: `Error: ${error.message}` }
          ],
        };
      }
    });
  }

  async start() {
    console.error('Filesystem MCP Server (LangChain format) started');
    console.error(`Allowed root: ${this.allowedRoot}`);
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
  }
}

const nodePath = path.resolve(process.argv[1]);
const modulePath = fileURLToPath(import.meta.url);
if (nodePath === modulePath) {
  const allowedRoot = process.argv[2] || process.cwd();
  const server = new SimpleFilesystemMcpServer(allowedRoot);
  server.start().catch((err) => {
    console.error("Fatal error starting server:", err);
    process.exit(1);
  });
}

export default SimpleFilesystemMcpServer;
