import readline from 'readline';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

export class SimpleFilesystemMcpServer {
  private allowedRoot: string;
  private rl: readline.Interface;

  constructor(allowedRoot: string = process.cwd()) {
    this.allowedRoot = path.resolve(allowedRoot);
    this.rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
      terminal: false
    });
  }

  start() {
    console.log('Simple Filesystem MCP Server started');
    console.log(`Allowed root: ${this.allowedRoot}`);
    
    this.rl.on('line', (line: string) => {
      try {
        const request = JSON.parse(line);
        this.handleRequest(request);
      } catch (error) {
        this.sendError('Invalid JSON', null);
      }
    });
  }

  handleRequest(request: any) {
    const { method, params, id } = request;

    try {
      switch (method) {
        case 'read_file':
          this.readFile(params.path, id);
          break;
        case 'write_file':
          this.writeFile(params.path, params.content, id);
          break;
        case 'list_directory':
          this.listDirectory(params.path, id);
          break;
        case 'get_file_info':
          this.getFileInfo(params.path, id);
          break;
        default:
          this.sendError(`Method not found: ${method}`, id);
      }
    } catch (error: any) {
      this.sendError(error.message, id);
    }
  }

  resolvePath(inputPath: string): string {
    const resolvedPath = path.resolve(this.allowedRoot, inputPath);
    const relativePath = path.relative(this.allowedRoot, resolvedPath);
    if (relativePath.startsWith('..') || path.isAbsolute(relativePath)) {
      throw new Error(`Access denied: Path '${inputPath}' is outside the allowed root`);
    }
    return resolvedPath;
  }

  readFile(filePath: string, id: string) {
    const fullPath = this.resolvePath(filePath);
    const content = fs.readFileSync(fullPath, 'utf8');
    this.sendResult({ content: [{ type: 'text', text: content }] }, id);
  }

  writeFile(filePath: string, content: string, id: string) {
    const fullPath = this.resolvePath(filePath);
    const dirPath = path.dirname(fullPath);
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
    }
    fs.writeFileSync(fullPath, content, 'utf8');
    this.sendResult({ result: 'File written successfully' }, id);
  }

  listDirectory(dirPath: string, id: string) {
    const fullPath = this.resolvePath(dirPath);
    const entries = fs.readdirSync(fullPath, { withFileTypes: true });
    
    const items = entries.map(entry => ({
      name: entry.name,
      type: entry.isDirectory() ? 'directory' : 'file'
    }));
    
    this.sendResult({ items }, id);
  }

  getFileInfo(itemPath: string, id: string) {
    const fullPath = this.resolvePath(itemPath);
    const stats = fs.statSync(fullPath);
    
    const info = {
      name: path.basename(fullPath),
      path: fullPath,
      size: stats.size,
      isDirectory: stats.isDirectory(),
      createdAt: stats.birthtime.toISOString(),
      modifiedAt: stats.mtime.toISOString()
    };
    
    this.sendResult(info, id);
  }

  sendResult(result: any, id: string) {
    const response = {
      jsonrpc: '2.0',
      id,
      result
    };
    console.log(JSON.stringify(response));
  }

  sendError(message: string, id: string | null) {
    const response = {
      jsonrpc: '2.0',
      id,
      error: {
        code: -32000,
        message
      }
    };
    console.log(JSON.stringify(response));
  }
}

const nodePath = path.resolve(process.argv[1]);
const modulePath = fileURLToPath(import.meta.url);
if (nodePath === modulePath) {
  const allowedRoot = process.argv[2] || process.cwd();
  const server = new SimpleFilesystemMcpServer(allowedRoot);
  server.start();
}

export default SimpleFilesystemMcpServer;
