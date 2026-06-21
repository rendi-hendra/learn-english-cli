import { MultiServerMCPClient } from "@langchain/mcp-adapters";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

let cachedClient: MultiServerMCPClient | null = null;
let cachedTools: any[] | null = null;

export async function getFsTools() {
  if (cachedTools) return cachedTools;

  // Cek apakah dijalankan dengan tsx (mode dev) atau node (mode build)
  const isTsNode = process.execArgv.some(arg => arg.includes('ts-node') || arg.includes('tsx')) || 
                   process.argv.some(arg => arg.includes('tsx'));
                   
  const command = isTsNode ? "npx" : "node";
  const mcpServerPath = isTsNode 
    ? path.resolve(__dirname, "../mcp-server.ts") 
    : path.resolve(__dirname, "../../dist/mcp-server.js");
    
  const args = isTsNode ? ["tsx", mcpServerPath, process.cwd()] : [mcpServerPath, process.cwd()];

  cachedClient = new MultiServerMCPClient({
    filesystem: {
      transport: "stdio",
      command: command,
      args: args,
    },
  });

  cachedTools = await cachedClient.getTools();
  return cachedTools;
}
