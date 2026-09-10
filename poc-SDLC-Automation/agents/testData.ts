import fs from "fs";
import { groq } from "../core/groqClient.js";
import { getModel } from "../config/models.js";
import { consoleLog } from "../core/logger.js";
import { registerAgent } from "../core/skillRegistry.js";

const systemPrompt = fs.readFileSync("./prompts/testData.md", "utf-8");

export class TestDataAgent {
  async execute(input: any) {
    consoleLog(`AGENT test_data — START (model: ${getModel("executor")})`);
    
    const prompt = `Generate data for requirements: ${JSON.stringify(input)}\n\nOutput MUST be JSON:\n{ "dataContext": { "user": "standard_user" }, "seedActions": [] }`;
    const res = await groq.call(getModel("executor"), systemPrompt, prompt, true);
    
    const text = res.text.replace(/```json/gi, "").replace(/```/g, "").trim();
    const parsed = JSON.parse(text);

    consoleLog(`AGENT test_data — END (dataContext ready, ${parsed.seedActions?.length || 0} seed actions) [${res.durationMs / 1000}s, ${res.usage.inputTokens + res.usage.outputTokens} tokens]`);
    return parsed;
  }
}

registerAgent("testData", "Generates test data", new TestDataAgent());
