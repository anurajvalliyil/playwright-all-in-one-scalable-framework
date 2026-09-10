# The 5-Pillar QE Framework

A scalable end-to-end testing framework using Playwright, designed to comprehensively test modern applications. This framework covers 5 critical pillars of software quality:

1. **UI Automation**: Robust Page Object Model (POM) and custom fixtures.
2. **API Contract Testing**: Strict JSON schema validation using `ajv`.
3. **Accessibility (a11y)**: Automatic WCAG scanning using `@axe-core/playwright`.
4. **Performance**: Integrated Lighthouse audits via `playwright-lighthouse`.
5. **Security**: Passive OWASP security header validation.

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

## Running Tests

Run specific pillars locally using npm scripts:

- **UI Tests**: `npm run test:ui`
- **API Tests**: `npm run test:api`
- **Accessibility**: `npm run test:a11y`
- **Performance**: `npm run test:perf`
- **Security**: `npm run test:security`
- **Run Everything**: `npm run test:all`

## Architecture Overview

- `config/environments.ts`: Master configuration loader mapping `process.env`.
- `page-objects/`: UI element locators and high-level interaction methods.
- `utils/`: Custom helpers including `logger.ts`, `schemaValidator.ts`, `securityScanner.ts`, and `performanceAudit.ts`.
- `data/schemas/`: Contains JSON schemas for API contract testing.
- `tests/`: Organized by pillar (`ui`, `api`, `a11y`, `performance`, `security`).
- `mcp-server/`: An MCP server that exposes Playwright execution capabilities.
- `.github/workflows/`: Native CI/CD pipeline for GitHub Actions.

## AI Agent Integration

This project contains an Antigravity agent skill. If you are using Antigravity, it will automatically load the `.agents/skills/playwright-framework/SKILL.md` when it navigates to this directory.
The MCP server is registered via `.agents/mcp_config.json` and exposes a tool `run_playwright_tests` allowing agents to autonomously execute subsets of tests and retrieve results.
