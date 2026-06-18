import SimpleFilesystemMcpServer from './services/simpleMcpServer.js';

const allowedRoot = process.argv[2] || process.cwd();

console.log('Starting Filesystem MCP Server...');
console.log('Allowed root directory:', allowedRoot);

const server = new SimpleFilesystemMcpServer(allowedRoot);
server.start();
