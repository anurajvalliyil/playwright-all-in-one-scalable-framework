import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";

async function main() {
  const isWin = process.platform === "win32";
  const transport = new StdioClientTransport({
    command: isWin ? "cmd.exe" : "npx",
    args: isWin 
      ? ["/c", "npx", "-y", "--registry=https://registry.npmjs.org/", "@playwright/mcp@latest"] 
      : ["-y", "--registry=https://registry.npmjs.org/", "@playwright/mcp@latest"]
  });
  
  const client = new Client({ name: "tool-lister", version: "1.0.0" }, { capabilities: {} });
  await client.connect(transport);
  
  const tools = await client.listTools();
  console.log(JSON.stringify(tools, null, 2));
  
  await transport.close();
}

main().catch(console.error);
