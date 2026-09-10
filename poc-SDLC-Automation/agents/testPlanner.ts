import fs from "fs";
import { groq } from "../core/groqClient.js";
import { getModel } from "../config/models.js";
import { consoleLog } from "../core/logger.js";
import { registerAgent } from "../core/skillRegistry.js";

const systemPrompt = fs.readFileSync("./prompts/testPlanner.md", "utf-8");

export class TestPlannerAgent {
  async execute(input: any) {
    consoleLog(`AGENT test_planner — START (model: ${getModel("planner")})`);
    
    const prompt = `Create test cases for these suites: ${JSON.stringify(input.testSuite)}\n\nOutput format MUST be JSON:\n{ "testCases": [ { "id": "TC-...", "suiteId": "suite_...", "title": "...", "steps": ["...", "..."], "targetApp": "ui", "dataRequirements": [], "assertionHints": [] } ] }\n\nIMPORTANT: Generate EXACTLY these steps in this EXACT order (do NOT split, merge, or reorder):\n1. "Navigate to https://www.saucedemo.com, fill username 'standard_user' and password 'secret_sauce', click Login button"\n2. "Verify the Products page title shows 'Products'"\n3. "Click add-to-cart button for Sauce Labs Backpack"\n4. "Click add-to-cart button for Sauce Labs Bike Light"\n5. "Verify the cart badge shows '2'"\n6. "Click the shopping cart link to go to cart page"\n7. "Verify cart contains 2 items"\n8. "Click the Checkout button"\n9. "Fill firstName with 'John', lastName with 'Doe', postalCode with '12345', click Continue"\n10. "Click the Finish button"\n11. "Verify the complete-header text is 'Thank you for your order!'"\n12. "Click the Back Home button"\n13. "Click the burger menu button, then click the Logout link"\n14. "Verify the login button is visible on the login page"`;
    const res = await groq.call(getModel("planner"), systemPrompt, prompt, true);
    
    const text = res.text.replace(/```json/gi, "").replace(/```/g, "").trim();
    const parsed = JSON.parse(text);
    const testCases = parsed.testCases || [];

    consoleLog(`AGENT test_planner — END (${testCases.length} test cases generated) [${res.durationMs / 1000}s, ${res.usage.inputTokens + res.usage.outputTokens} tokens]`);
    return { testCases };
  }
}

registerAgent("testPlanner", "Generates test cases", new TestPlannerAgent());
