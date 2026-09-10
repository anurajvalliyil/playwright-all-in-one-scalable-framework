import fs from "fs";
import { groq } from "../core/groqClient.js";
import { getModel } from "../config/models.js";
import { consoleLog } from "../core/logger.js";
import { registerAgent } from "../core/skillRegistry.js";

const systemPrompt = fs.readFileSync("./prompts/crossValidator.md", "utf-8");

export class CrossValidatorAgent {
  async execute(context: any) {
    // Strip huge Base64 screenshots from the payload to avoid Llama-3 token bloat
    const cleanResults = JSON.parse(JSON.stringify(context.results));
    for (const key in cleanResults) {
      if (cleanResults[key].ui && cleanResults[key].ui.screenshots) {
        delete cleanResults[key].ui.screenshots;
      }
    }
    const prompt = `Validate the state context: ${JSON.stringify(cleanResults)}\nOutput JSON: { "matched": true, "score": "X/Y" }`;
    const res = await groq.call(getModel("analyst"), systemPrompt, prompt, true);
    
    let text = res.text.replace(/```json/gi, "").replace(/```/g, "").trim();
    const parsed = JSON.parse(text);

    consoleLog(`AGENT cross_validator — product name match: ${parsed.score}`);
    return parsed;
  }
}
registerAgent("crossValidator", "Cross validates state", new CrossValidatorAgent());
