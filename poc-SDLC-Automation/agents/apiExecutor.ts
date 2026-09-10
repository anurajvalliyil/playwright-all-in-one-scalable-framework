import fs from "fs";
import { groq } from "../core/groqClient.js";
import { getModel } from "../config/models.js";
import { consoleLog } from "../core/logger.js";
import { registerAgent } from "../core/skillRegistry.js";
import { APIExecutionResult, APICallResult } from "../schemas/executionResult.js";

const systemPrompt = fs.readFileSync("./prompts/apiExecutor.md", "utf-8");

export class APIExecutorAgent {
  async execute(testCase: any, context: any): Promise<APIExecutionResult> {
    const calls: APICallResult[] = [];
    let passed = true;

    for (let i = 0; i < testCase.steps.length; i++) {
      const step = testCase.steps[i];
      const start = Date.now();
      let status = 200;
      let stepPassed = true;

      try {
        if (step.includes("GET")) {
          const url = step.replace("GET ", "");
          const res = await fetch(url);
          status = res.status;
          if (!res.ok) stepPassed = false;
        }
      } catch (e: any) {
        stepPassed = false;
        status = 500;
      }

      calls.push({
        stepId: `step_${i}`,
        endpoint: step,
        method: "GET",
        statusCode: status,
        passed: stepPassed,
        durationMs: Date.now() - start
      });

      if (!stepPassed) passed = false;
    }

    return { passed, calls, schemaViolations: [] };
  }
}

registerAgent("apiExecutor", "Executes API tests", new APIExecutorAgent());
