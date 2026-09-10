"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const index_js_1 = require("@modelcontextprotocol/sdk/server/index.js");
const stdio_js_1 = require("@modelcontextprotocol/sdk/server/stdio.js");
const types_js_1 = require("@modelcontextprotocol/sdk/types.js");
const child_process_1 = require("child_process");
const util = __importStar(require("util"));
const path = __importStar(require("path"));
const execAsync = util.promisify(child_process_1.exec);
const server = new index_js_1.Server({
    name: "playwright-mcp-server",
    version: "1.0.0",
}, {
    capabilities: {
        tools: {},
    },
});
const frameworkDir = path.resolve(__dirname, "../../");
server.setRequestHandler(types_js_1.ListToolsRequestSchema, async () => {
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
server.setRequestHandler(types_js_1.CallToolRequestSchema, async (request) => {
    if (request.params.name === "run_playwright_tests") {
        const suite = request.params.arguments?.suite;
        let command = "npx playwright test";
        if (suite === "ui")
            command = "npm run test:ui";
        else if (suite === "api")
            command = "npm run test:api";
        else if (suite === "qa")
            command = "npm run test:qa";
        else if (suite === "dev")
            command = "npm run test:dev";
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
        }
        catch (error) {
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
    const transport = new stdio_js_1.StdioServerTransport();
    await server.connect(transport);
    console.error("Playwright MCP Server running on stdio");
}
main().catch(console.error);
