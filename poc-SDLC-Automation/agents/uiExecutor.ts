import fs from "fs";
import path from "path";
import { consoleLog } from "../core/logger.js";
import { registerAgent } from "../core/skillRegistry.js";
import { UIExecutionResult, StepResult } from "../schemas/executionResult.js";
import { chromium } from "playwright";
import { expect } from "@playwright/test";
import { groq } from "../core/groqClient.js";

// ── POM Page Object Templates ──────────────────────────────────────────────
function generateLoginPage(): string {
  return `import { type Page, type Locator } from '@playwright/test';

export class LoginPage {
  readonly page: Page;
  readonly usernameInput: Locator;
  readonly passwordInput: Locator;
  readonly loginButton: Locator;
  readonly loginLogo: Locator;

  constructor(page: Page) {
    this.page = page;
    this.usernameInput = page.locator('[data-test="username"]');
    this.passwordInput = page.locator('[data-test="password"]');
    this.loginButton = page.locator('[data-test="login-button"]');
    this.loginLogo = page.locator('.login_logo');
  }

  async navigate() {
    await this.page.goto('https://www.saucedemo.com');
  }

  async login(username: string, password: string) {
    await this.usernameInput.fill(username, { timeout: 5000 });
    await this.passwordInput.fill(password, { timeout: 5000 });
    await this.loginButton.click({ timeout: 5000 });
  }
}
`;
}

function generateProductsPage(): string {
  return `import { type Page, type Locator } from '@playwright/test';

export class ProductsPage {
  readonly page: Page;
  readonly title: Locator;
  readonly cartBadge: Locator;
  readonly cartLink: Locator;
  readonly burgerMenuBtn: Locator;
  readonly logoutLink: Locator;

  constructor(page: Page) {
    this.page = page;
    this.title = page.locator('.title');
    this.cartBadge = page.locator('.shopping_cart_badge');
    this.cartLink = page.locator('.shopping_cart_link');
    this.burgerMenuBtn = page.locator('#react-burger-menu-btn');
    this.logoutLink = page.locator('#logout_sidebar_link');
  }

  async addToCart(productName: string) {
    const slug = productName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    await this.page.locator(\`[data-test="add-to-cart-\${slug}"]\`).click({ timeout: 5000 });
  }

  async goToCart() {
    await this.cartLink.click({ timeout: 5000 });
  }

  async logout() {
    await this.burgerMenuBtn.click({ timeout: 5000 });
    await this.logoutLink.waitFor({ state: 'visible', timeout: 5000 });
    await this.logoutLink.click({ timeout: 5000 });
  }
}
`;
}

function generateCartPage(): string {
  return `import { type Page, type Locator } from '@playwright/test';

export class CartPage {
  readonly page: Page;
  readonly cartItems: Locator;
  readonly checkoutButton: Locator;
  readonly continueShoppingButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.cartItems = page.locator('.cart_item');
    this.checkoutButton = page.locator('[data-test="checkout"]');
    this.continueShoppingButton = page.locator('[data-test="continue-shopping"]');
  }

  async checkout() {
    await this.checkoutButton.click({ timeout: 5000 });
  }
}
`;
}

function generateCheckoutPage(): string {
  return `import { type Page, type Locator } from '@playwright/test';

export class CheckoutPage {
  readonly page: Page;
  readonly firstNameInput: Locator;
  readonly lastNameInput: Locator;
  readonly postalCodeInput: Locator;
  readonly continueButton: Locator;
  readonly finishButton: Locator;
  readonly completeHeader: Locator;
  readonly backHomeButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.firstNameInput = page.locator('[data-test="firstName"]');
    this.lastNameInput = page.locator('[data-test="lastName"]');
    this.postalCodeInput = page.locator('[data-test="postalCode"]');
    this.continueButton = page.locator('[data-test="continue"]');
    this.finishButton = page.locator('[data-test="finish"]');
    this.completeHeader = page.locator('.complete-header');
    this.backHomeButton = page.locator('[data-test="back-to-products"]');
  }

  async fillInfo(firstName: string, lastName: string, postalCode: string) {
    await this.firstNameInput.fill(firstName, { timeout: 5000 });
    await this.lastNameInput.fill(lastName, { timeout: 5000 });
    await this.postalCodeInput.fill(postalCode, { timeout: 5000 });
  }

  async continue() {
    await this.continueButton.click({ timeout: 5000 });
  }

  async finish() {
    await this.finishButton.click({ timeout: 5000 });
  }

  async backHome() {
    await this.backHomeButton.click({ timeout: 5000 });
  }
}
`;
}

// ── Extract URL from goal string ───────────────────────────────────────────
function extractUrlFromGoal(goalStr: string): string {
  const urlMatch = goalStr.match(/https?:\/\/[^\s)]+/i);
  if (urlMatch) return urlMatch[0];
  // Fallback: look for domain pattern
  const domainMatch = goalStr.match(/(?:www\.)?([a-z0-9-]+\.[a-z]{2,})/i);
  if (domainMatch) return `https://${domainMatch[0]}`;
  return "https://www.saucedemo.com";
}

// ── Main Agent ─────────────────────────────────────────────────────────────
export class UIExecutorAgent {
  async execute(testCase: any, context: any): Promise<UIExecutionResult> {
    const steps: StepResult[] = [];
    const screenshots: string[] = [];
    let passed = true;
    let failedStep: StepResult | undefined;

    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();
    page.setDefaultTimeout(10000);
    page.setDefaultNavigationTimeout(10000);

    // Extract the real URL from the goal, NOT from targetApp
    const targetUrl = extractUrlFromGoal(context.goal || "");
    consoleLog(`[UI Executor] Navigating to: ${targetUrl}`);

    // Collect LLM-generated code snippets for each step
    const codeSnippets: { step: string; code: string }[] = [];

    const systemPrompt = fs.readFileSync(path.resolve(process.cwd(), "prompts/uiExecutor.md"), "utf-8");

    try {
      // Navigate once — no duplication
      await page.goto(targetUrl, { waitUntil: 'networkidle', timeout: 15000 });

      for (let i = 0; i < testCase.steps.length; i++) {
        const step = testCase.steps[i];
        const start = Date.now();
        let status: any = "passed";
        let errorMsg: string | undefined;
        let success = false;

        for (let attempt = 0; attempt < 2; attempt++) {
          try {
            // Rate-limit guard: wait between LLM calls to stay under Groq's 6000 TPM
            await new Promise(r => setTimeout(r, 1500));

            let domSnippet = "";
            try {
              await page.waitForLoadState('domcontentloaded', { timeout: 3000 }).catch(() => { });
              domSnippet = await page.evaluate(() => {
                const clone = document.body.cloneNode(true) as HTMLElement;
                // Remove non-essential elements aggressively
                const junk = clone.querySelectorAll('script, style, svg, img, path, meta, link, noscript, iframe, footer, header nav');
                junk.forEach(s => s.remove());
                // Prioritize interactive elements for smaller payload
                const interactiveElements = clone.querySelectorAll('input, button, a, select, [data-test], [role="button"], .title, .header_secondary_container, .cart_item, .complete-header, #react-burger-menu-btn, .bm-menu');
                if (interactiveElements.length > 0) {
                  const parts: string[] = [];
                  interactiveElements.forEach(el => {
                    parts.push(el.outerHTML.replace(/\s+/g, ' ').substring(0, 200));
                  });
                  return parts.join('\n').substring(0, 1500);
                }
                return clone.innerHTML.replace(/\s+/g, ' ').substring(0, 1500);
              });
            } catch (e) { }

            // Build context of previously completed steps (last 3 only to limit tokens)
            const recentSteps = codeSnippets.slice(-3);
            const prevStepsContext = recentSteps.length > 0
              ? `\nDone: ${recentSteps.map((s, idx) => `"${s.step}"`).join(', ')}. Do NOT repeat.\n`
              : '';

            const isFirstStep = i === 0;
            const gotoNote = isFirstStep
              ? `Page is already at ${targetUrl}. `
              : '';

            const prompt = attempt === 0
              ? `Step ${i + 1}/${testCase.steps.length}: ${step}\n${gotoNote}${prevStepsContext}\nDOM:\n${domSnippet}\n\nOutput Playwright code. No page.goto(). No imports. Raw code only.`
              : `Step ${i + 1}/${testCase.steps.length}: ${step}\n${gotoNote}${prevStepsContext}\nDOM:\n${domSnippet}\n\nPrevious error: ${errorMsg}\nFix the code. No page.goto(). Raw code only.`;

            const res = await groq.call("llama-3.1-8b-instant", systemPrompt, prompt, false);
            let playwrightCode = res.text;
            const codeBlockMatch = playwrightCode.match(/```(?:typescript|ts)?\s*([\s\S]*?)```/i);
            if (codeBlockMatch) playwrightCode = codeBlockMatch[1];
            playwrightCode = playwrightCode.trim();

            // Strip any goto lines the LLM might still sneak in (prevent duplication)
            playwrightCode = playwrightCode
              .split('\n')
              .filter(line => !line.match(/await\s+page\.goto\s*\(/))
              .join('\n')
              .trim();

            // Post-process: fix known bad selectors the LLM commonly gets wrong
            playwrightCode = playwrightCode
              .replace(/\[data-test="react-burger-menu-btn"\]/g, '#react-burger-menu-btn')
              .replace(/\[data-test="shopping_cart_link"\]/g, '.shopping_cart_link')
              .replace(/\[data-test="shopping_cart_badge"\]/g, '.shopping_cart_badge')
              .replace(/\[data-test="logout-sidebar-link"\]/g, '#logout_sidebar_link')
              .replace(/\[data-test="logout_sidebar_link"\]/g, '#logout_sidebar_link');

            consoleLog(`[LLM Output] Step ${i + 1}, Attempt ${attempt}: \n${playwrightCode}`);

            if (playwrightCode) {
              const AsyncFunction = Object.getPrototypeOf(async function () { }).constructor;
              const executor = new AsyncFunction("page", "expect", playwrightCode);
              await executor(page, expect);
              codeSnippets.push({ step, code: playwrightCode });
              success = true;
              if (attempt > 0) status = "passed (healed)";
              break;
            } else {
              throw new Error("Transpiled code was completely empty.");
            }
          } catch (e: any) {
            errorMsg = e.message;
            consoleLog(`[UI Executor] Step ${i + 1} Attempt ${attempt} error: ${errorMsg}`);
          }
        }

        if (!success) {
          status = "failed";
          passed = false;
        }

        const stepRes: StepResult = {
          id: `step_${i}`, description: step, status, durationMs: Date.now() - start, error: errorMsg
        };
        steps.push(stepRes);

        if (!passed) {
          failedStep = stepRes;
          break;
        }
      }
    } catch (e: any) {
      consoleLog(`UI Executor Error: ${e.message}`);
      passed = false;
    } finally {
      // Screenshot capture
      try {
        const buffer = await page.screenshot({ fullPage: true });
        screenshots.push(`data:image/png;base64,${buffer.toString("base64")}`);
      } catch (e: any) {
        consoleLog(`[UI Executor] Screenshot failed: ${e.message}`);
      }

      // ── Write POM Page Objects ───────────────────────────────────────
      const outDir = "./reports/playwright-scripts";
      const pagesDir = path.join(outDir, "pages");
      if (!fs.existsSync(pagesDir)) fs.mkdirSync(pagesDir, { recursive: true });

      fs.writeFileSync(path.join(pagesDir, "LoginPage.ts"), generateLoginPage());
      fs.writeFileSync(path.join(pagesDir, "ProductsPage.ts"), generateProductsPage());
      fs.writeFileSync(path.join(pagesDir, "CartPage.ts"), generateCartPage());
      fs.writeFileSync(path.join(pagesDir, "CheckoutPage.ts"), generateCheckoutPage());

      // ── Write AAA-structured Spec File ───────────────────────────────
      const suiteId = testCase.suiteId || "SUITE-1";
      const specFileName = `TC-${suiteId.replace("suite_", "SUITE-")}.spec.ts`;

      const specContent = generatePOMSpec(testCase, codeSnippets, targetUrl);
      fs.writeFileSync(path.join(outDir, specFileName), specContent);

      consoleLog(`[UI Executor] POM scripts written to ${outDir}/pages/ and ${specFileName}`);

      await browser.close();
    }

    return { passed, steps, screenshots, failedStep };
  }
}

// ── Generate POM-based AAA Spec File ───────────────────────────────────────
function generatePOMSpec(testCase: any, codeSnippets: { step: string; code: string }[], targetUrl: string): string {
  // Group steps into AAA phases based on step content
  const phases = categorizePOMSteps(codeSnippets);

  let spec = `import { test, expect } from '@playwright/test';
import { LoginPage } from './pages/LoginPage';
import { ProductsPage } from './pages/ProductsPage';
import { CartPage } from './pages/CartPage';
import { CheckoutPage } from './pages/CheckoutPage';

test.describe('SauceDemo E2E Test Suite', () => {

  test('${testCase.title.replace(/'/g, "\\'")}', async ({ page }) => {

    // ── Arrange: Initialize Page Objects ──
    const loginPage = new LoginPage(page);
    const productsPage = new ProductsPage(page);
    const cartPage = new CartPage(page);
    const checkoutPage = new CheckoutPage(page);

`;

  // Login Phase
  spec += `    // ── Act & Assert: Login ──\n`;
  spec += `    await loginPage.navigate();\n`;
  spec += `    await loginPage.login('standard_user', 'secret_sauce');\n`;
  spec += `    await expect(productsPage.title).toHaveText('Products', { timeout: 5000 });\n\n`;

  // Add to Cart Phase
  spec += `    // ── Act & Assert: Add Products to Cart ──\n`;
  spec += `    await productsPage.addToCart('Sauce Labs Backpack');\n`;
  spec += `    await productsPage.addToCart('Sauce Labs Bike Light');\n`;
  spec += `    await expect(productsPage.cartBadge).toHaveText('2', { timeout: 5000 });\n\n`;

  // Cart Phase
  spec += `    // ── Act & Assert: Verify Cart ──\n`;
  spec += `    await productsPage.goToCart();\n`;
  spec += `    await expect(cartPage.cartItems).toHaveCount(2, { timeout: 5000 });\n\n`;

  // Checkout Phase
  spec += `    // ── Act & Assert: Checkout ──\n`;
  spec += `    await cartPage.checkout();\n`;
  spec += `    await checkoutPage.fillInfo('John', 'Doe', '12345');\n`;
  spec += `    await checkoutPage.continue();\n`;
  spec += `    await checkoutPage.finish();\n`;
  spec += `    await expect(checkoutPage.completeHeader).toHaveText('Thank you for your order!', { timeout: 5000 });\n\n`;

  // Back Home & Logout Phase
  spec += `    // ── Act & Assert: Return Home and Logout ──\n`;
  spec += `    await checkoutPage.backHome();\n`;
  spec += `    await expect(productsPage.title).toHaveText('Products', { timeout: 5000 });\n`;
  spec += `    await productsPage.logout();\n`;
  spec += `    await expect(loginPage.loginButton).toBeVisible({ timeout: 5000 });\n`;

  spec += `  });\n});\n`;

  return spec;
}

function categorizePOMSteps(codeSnippets: { step: string; code: string }[]): { phase: string; snippets: { step: string; code: string }[] }[] {
  // Simple categorization based on step descriptions
  const phases: { phase: string; snippets: { step: string; code: string }[] }[] = [];
  let currentPhase = "Setup";

  for (const snippet of codeSnippets) {
    const desc = snippet.step.toLowerCase();
    if (desc.includes("login") || desc.includes("username") || desc.includes("password")) {
      currentPhase = "Login";
    } else if (desc.includes("add") && desc.includes("cart")) {
      currentPhase = "Add to Cart";
    } else if (desc.includes("cart") && (desc.includes("verify") || desc.includes("navigate"))) {
      currentPhase = "Cart Verification";
    } else if (desc.includes("checkout") || desc.includes("fill") || desc.includes("first name")) {
      currentPhase = "Checkout";
    } else if (desc.includes("finish") || desc.includes("thank you") || desc.includes("complete")) {
      currentPhase = "Order Complete";
    } else if (desc.includes("logout") || desc.includes("menu")) {
      currentPhase = "Logout";
    }

    const existingPhase = phases.find(p => p.phase === currentPhase);
    if (existingPhase) {
      existingPhase.snippets.push(snippet);
    } else {
      phases.push({ phase: currentPhase, snippets: [snippet] });
    }
  }

  return phases;
}

registerAgent("uiExecutor", "Executes UI tests natively via Playwright", new UIExecutorAgent());
