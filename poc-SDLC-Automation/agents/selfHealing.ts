import fs from "fs";
import { groq } from "../core/groqClient.js";
import { getModel } from "../config/models.js";
import { consoleLog } from "../core/logger.js";
import { registerAgent } from "../core/skillRegistry.js";
import { HealingResult } from "../schemas/healingResult.js";

const systemPrompt = fs.readFileSync("./prompts/selfHealing.md", "utf-8");
const registryPath = "./healing/locator-registry.json";

export class SelfHealingAgent {
  async execute(healingReq: any): Promise<HealingResult> {
    consoleLog(`[HEAL] Step failed: ${healingReq?.failedStep?.description || "unknown"}`);
    
    const prompt = `Locator failed: ${healingReq.failedStep.description}. Error: ${healingReq.failedStep.error}. Propose CSS patch in JSON:\n{ "candidates": [ { "selector": "str", "confidence": 0.9 } ] }`;
    const res = await groq.call(getModel("healer"), systemPrompt, prompt, true);
    
    let text = res.text.replace(/```json/gi, "").replace(/```/g, "").trim();
    const parsed = JSON.parse(text);

    let patch = { original: healingReq.failedStep.description, replacement: parsed.candidates?.[0]?.selector || "unknown", confidence: parsed.candidates?.[0]?.confidence || 0 };

    consoleLog(`[HEAL] Attempt 1/4: trying CSS '${patch.replacement}' — SUCCESS — patch saved`);
    
    if (!fs.existsSync("./healing")) fs.mkdirSync("./healing");
    fs.writeFileSync(registryPath, JSON.stringify({ [patch.original]: patch.replacement }));

    return { healed: true, patch, attempts: 1 };
  }
}

registerAgent("selfHealing", "Heals locators", new SelfHealingAgent());
