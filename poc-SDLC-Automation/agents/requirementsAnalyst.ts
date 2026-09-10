import fs from "fs";
import { groq } from "../core/groqClient.js";
import { getModel } from "../config/models.js";
import { consoleLog } from "../core/logger.js";
import { registerAgent } from "../core/skillRegistry.js";

const systemPrompt = fs.readFileSync("./prompts/requirementsAnalyst.md", "utf8");

export class RequirementsAnalystAgent {
  async execute(goal: string) {
    consoleLog(`AGENT requirements_analyst — START (model: ${getModel("planner")})`);
    
    const prompt = `Analyze this goal: ${goal}\n\nOutput format MUST be JSON:\n{ "testSuite": [ { "id": "suite_1", "title": "str", "priority": "high", "targetApp": "both" } ], "riskAreas": ["str"], "estimatedDuration": 5000 }`;
    const res = await groq.call(getModel("planner"), systemPrompt, prompt, true);
    
    const text = res.text.replace(/```json/gi, "").replace(/```/g, "").trim();
    const parsed = JSON.parse(text);

    consoleLog(`AGENT requirements_analyst — END (${parsed.testSuite?.length || 0} suites, 0 test cases, ${parsed.riskAreas?.length || 0} risk areas) [${res.durationMs / 1000}s, ${res.usage.inputTokens + res.usage.outputTokens} tokens]`);
    return parsed;
  }
}

registerAgent("requirementsAnalyst", "Analyzes requirements", new RequirementsAnalystAgent());
