import SimpleFilesystemMcpServer from './services/simpleMcpServer.js';

const allowedRoot = process.argv[2] || process.cwd();

console.error('Starting Filesystem MCP Server...');
console.error('Allowed root directory:', allowedRoot);

const server = new SimpleFilesystemMcpServer(allowedRoot);
server.start();
