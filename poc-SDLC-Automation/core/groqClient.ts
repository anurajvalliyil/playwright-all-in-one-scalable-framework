import { tokenBudget } from "./tokenBudget.js";
import { logEvent, consoleLog } from "./logger.js";

// Renamed internally but keeping class name to avoid breaking the 9 agent imports
export class GroqClient {
  private apiKey: string;
  private fallbackModels = [
    "llama-3.3-70b-versatile",
    "qwen/qwen3-32b",
    "llama-3.1-8b-instant",
    "meta-llama/llama-4-scout-17b-16e-instruct",
    "allam-2-7b",
    "groq/compound",
    "groq/compound-mini",
    "openai/gpt-oss-120b",
    "openai/gpt-oss-20b",
    "openai/gpt-oss-safeguard-20b",
    "meta-llama/llama-prompt-guard-2-22m",
    "meta-llama/llama-prompt-guard-2-86m"
  ];

  constructor() {
    this.apiKey = process.env.GROQ_API_KEY || "";
  }

  public async call(model: string, systemPrompt: string, userPrompt: string, jsonMode: boolean = false, retryCount: number = 0): Promise<{text: string, usage: any, durationMs: number}> {
    const startMs = Date.now();
    try {
      if (!this.apiKey) {
        throw new Error("GROQ_API_KEY is not set in environment. Please update your .env file.");
      }
      
      const url = `https://api.groq.com/openai/v1/chat/completions`;
      const payload: any = {
        model: model,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ],
        max_tokens: 4096,
        temperature: 0.2
      };

      if (jsonMode) {
        payload.response_format = { type: "json_object" };
      }

      const res = await fetch(url, {
        method: "POST",
        headers: { 
            "Content-Type": "application/json",
            "Authorization": `Bearer ${this.apiKey}` 
        },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const errText = await res.text();
        throw new Error(`Groq API Error: ${res.status} ${errText}`);
      }

      const data = await res.json();
      const text = data.choices?.[0]?.message?.content || "";
      const usage = {
        inputTokens: data.usage?.prompt_tokens || 0,
        outputTokens: data.usage?.completion_tokens || 0
      };

      tokenBudget.addUsage(usage.inputTokens + usage.outputTokens);
      
      return { text, usage, durationMs: Date.now() - startMs };
    } catch (e: any) {
      // Handle 413 (request too large) by truncating prompt
      if (e.message.includes("413") || e.message.includes("Request too large")) {
        if (retryCount < 2) {
          consoleLog(`[Groq] Request too large for ${model}. Truncating prompt and retrying...`);
          // Truncate user prompt to ~60% of its size
          const truncatedPrompt = userPrompt.substring(0, Math.floor(userPrompt.length * 0.6));
          await new Promise(res => setTimeout(res, 3000));
          return this.call(model, systemPrompt, truncatedPrompt, jsonMode, retryCount + 1);
        }
        throw new Error(`Request still too large after truncation. Reduce prompt size.`);
      }

      if (e.message.includes("429")) {
        const currentIdx = this.fallbackModels.indexOf(model);
        const nextIdx = currentIdx === -1 ? 0 : (currentIdx + 1) % this.fallbackModels.length;
        
        // Prevent infinite loops if all models are exhausted in a single call stack
        if (retryCount >= this.fallbackModels.length) {
          throw new Error("All fallback models exhausted due to rate limits.");
        }

        const fallback = this.fallbackModels[nextIdx];
        consoleLog(`[Groq Rate Limit] Model ${model} rate limited. Cycling to fallback: ${fallback}...`);
        await new Promise(res => setTimeout(res, 2000));
        return this.call(fallback, systemPrompt, userPrompt, jsonMode, retryCount + 1);
      }

      if (retryCount < 3) {
        consoleLog(`Groq LLM call failed, retrying (${retryCount + 1}/3)...`);
        await new Promise(res => setTimeout(res, 2000 * Math.pow(2, retryCount)));
        return this.call(model, systemPrompt, userPrompt, jsonMode, retryCount + 1);
      }
      throw e;
    }
  }
}

export const groq = new GroqClient();
