# Highly Scalable Playwright Automation Framework

A scalable end-to-end testing framework using Playwright, designed to support UI and API testing across multiple environments, featuring built-in MCP (Model Context Protocol) support for AI agents.

## Features

- **Multi-Environment Support**: Seamlessly switch between `qa`, `dev`, etc. via `.env` files.
- **Page Object Model (POM)**: Robust UI automation patterns for `saucedemo.com`.
- **API Testing Utilities**: Extensible API testing setup supporting full CRUD operations.
- **AI Agent Native**: Built-in Antigravity Skill (`.agents/skills/playwright-framework`) and an MCP server.
- **Parallel Execution**: Fully parallelized test running for fast execution.

## Getting Started

### Prerequisites
- Node.js >= 20
- npm or yarn

### Installation
1. Install dependencies:
   ```bash
   npm install
   npx playwright install chromium
   ```

2. Build the MCP Server (optional, for AI agents):
   ```bash
   cd mcp-server
   npm install
   npm run build
   ```

### Running Tests

Run tests locally using predefined npm scripts:

- **UI Tests**: `npm run test:ui`
- **API Tests**: `npm run test:api`
- **QA Environment**: `npm run test:qa`
- **DEV Environment**: `npm run test:dev`

## Architecture Overview

- `config/environments.ts`: Master configuration loader mapping `process.env` to typed configurations.
- `page-objects/`: UI element locators and high-level interaction methods.
- `utils/`: Shared utilities, such as `apiHelper.ts`.
- `tests/`: 
  - `ui/`: End-to-end browser tests.
  - `api/`: API integration tests.
- `mcp-server/`: An MCP server that exposes Playwright execution capabilities to standard LLM agents.
- `.agents/`: Contains the Antigravity `mcp_config.json` and the framework `SKILL.md`.

## Integration with Antigravity Agents

This project contains an Antigravity agent skill. If you are using Antigravity, it will automatically load the `.agents/skills/playwright-framework/SKILL.md` when it navigates to this directory.

The MCP server is registered via `.agents/mcp_config.json` and exposes a tool `run_playwright_tests` allowing agents to autonomously execute subsets of tests and retrieve results.
