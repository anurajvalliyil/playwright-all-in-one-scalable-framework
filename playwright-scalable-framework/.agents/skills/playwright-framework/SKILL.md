---
name: playwright-framework
description: Provides instructions on how to interact with the Playwright scalable automation framework.
---

# Playwright Scalable Framework Skill

This skill explains how to navigate and utilize the Playwright automation framework located in this repository.

## Framework Architecture

- **`tests/ui/`**: Contains end-to-end UI tests targeting `saucedemo.com`. Uses the Page Object Model (POM).
- **`tests/api/`**: Contains API tests (currently mocking against `reqres.in`).
- **`page-objects/`**: Encapsulates locators and methods for UI interactions (e.g., `LoginPage.ts`, `InventoryPage.ts`).
- **`utils/`**: Shared utilities like `apiHelper.ts`.
- **`config/environments.ts`**: Helper to load dynamic environment variables.
- **`.env.<env>`**: Environment-specific configurations (e.g., `.env.qa`, `.env.dev`).

## Executing Tests

To run the tests locally, use standard npm scripts:
- `npm run test:ui`: Runs all UI tests.
- `npm run test:api`: Runs all API tests.
- `npm run test:qa`: Runs all tests against the QA environment.
- `npm run test:dev`: Runs all tests against the DEV environment.

## MCP Server

This framework includes an MCP (Model Context Protocol) Server for AI agents to trigger tests.
The MCP server is located in `mcp-server/`.

If you are an agent trying to run these tests, you can call the MCP tool `run_playwright_tests` with the desired test suite (`ui`, `api`, `qa`, `dev`).

## Best Practices

1. **Locators**: Prefer Playwright's user-facing locators (e.g., `getByRole`, `getByText`, or custom `data-test` attributes) over complex CSS/XPath.
2. **Environment Variables**: Never hardcode credentials. Always use `environments.credentials...` imported from `config/environments.ts`.
3. **Assertions**: Utilize Playwright's built-in web-first assertions (e.g., `expect(locator).toBeVisible()`) to ensure automatic waiting and reduce flakiness.
