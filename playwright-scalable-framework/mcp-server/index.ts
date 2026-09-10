import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { exec } from "child_process";
import * as util from "util";
import * as path from "path";

const execAsync = util.promisify(exec);

const server = new Server(
  {
    name: "playwright-mcp-server",
    version: "1.0.0",
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

const frameworkDir = path.resolve(__dirname, "../../");

server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: "run_playwright_tests",
        description: "Run Playwright automation tests",
        inputSchema: {
          type: "object",
          properties: {
            suite: {
              type: "string",
              description: "The test suite to run. Allowed values: 'ui', 'api', 'qa', 'dev', or empty to run all",
              enum: ["ui", "api", "qa", "dev", "all"],
            },
          },
        },
      },
    ],
  };
});

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  if (request.params.name === "run_playwright_tests") {
    const suite = request.params.arguments?.suite as string;
    let command = "npx playwright test";
    
    if (suite === "ui") command = "npm run test:ui";
    else if (suite === "api") command = "npm run test:api";
    else if (suite === "qa") command = "npm run test:qa";
    else if (suite === "dev") command = "npm run test:dev";

    try {
      const { stdout, stderr } = await execAsync(command, { cwd: frameworkDir });
      return {
        content: [
          {
            type: "text",
            text: `Tests executed successfully.\n\nSTDOUT:\n${stdout}\n\nSTDERR:\n${stderr}`,
          },
        ],
      };
    } catch (error: any) {
      return {
        content: [
          {
            type: "text",
            text: `Tests execution failed.\n\nSTDOUT:\n${error.stdout}\n\nSTDERR:\n${error.stderr}\n\nError Message:\n${error.message}`,
          },
        ],
      };
    }
  }
  
  throw new Error(`Tool not found: ${request.params.name}`);
});

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Playwright MCP Server running on stdio");
}

main().catch(console.error);
