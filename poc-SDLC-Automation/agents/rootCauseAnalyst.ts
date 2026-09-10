import fs from "fs";
import { groq } from "../core/groqClient.js";
import { getModel } from "../config/models.js";
import { consoleLog } from "../core/logger.js";
import { registerAgent } from "../core/skillRegistry.js";

const systemPrompt = fs.readFileSync("./prompts/rootCauseAnalyst.md", "utf-8");

export class RootCauseAnalystAgent {
  async execute(failures: any[]) {
    if (failures.length === 0) return {};

    const prompt = `Analyze these failures: ${JSON.stringify(failures)}. Output JSON:\n{ "category": "locator", "rootCause": "...", "suggestedFix": "...", "confidence": 0.9, "rerunRecommendation": false }`;
    const res = await groq.call(getModel("analyst"), systemPrompt, prompt, true);
    
    let text = res.text.replace(/```json/gi, "").replace(/```/g, "").trim();
    const parsed = JSON.parse(text);

    consoleLog(`AGENT root_cause_analyst — ${failures.length} failure(s) analysed (category: ${parsed.category})`);
    return parsed;
  }
}
registerAgent("rootCauseAnalyst", "Analyzes failures", new RootCauseAnalystAgent());
