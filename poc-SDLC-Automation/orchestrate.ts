import "dotenv/config";
import fs from "fs";
import path from "path";
import { execSync } from "child_process";
import { OrchestratorAgent } from "./orchestrator/index.js";
import { consoleLog } from "./core/logger.js";

async function main() {
  const goalPath = path.resolve("./config/goal.json");
  const goalData = JSON.parse(fs.readFileSync(goalPath, "utf-8"));
  
  const orchestrator = new OrchestratorAgent();
  await orchestrator.execute(goalData.goal);

  // ── DeepEval Evaluation Phase ─────────────────────────────────────
  consoleLog("DEEPEVAL — Starting LLM result evaluation...");
  try {
    execSync("python evaluate.py", {
      stdio: "inherit",
      cwd: process.cwd(),
      env: { ...process.env },
      timeout: 180000 // 3-minute timeout for evaluation
    });
    consoleLog("DEEPEVAL — Evaluation complete. Results at ./reports/eval_results.json");

    // Read eval results and display summary
    const evalPath = path.resolve("./reports/eval_results.json");
    const htmlPath = path.resolve("./reports/summary.html");
    
    if (fs.existsSync(evalPath)) {
      const evalDataStr = fs.readFileSync(evalPath, "utf-8");
      const evalData = JSON.parse(evalDataStr);
      consoleLog(`DEEPEVAL — Overall Score: ${evalData.overallScore} | Status: ${evalData.overallPassed ? "ALL PASSED ✅" : "SOME FAILED ❌"}`);
      
      // Inject results into HTML to avoid CORS issues with file:// protocol
      if (fs.existsSync(htmlPath)) {
        let htmlStr = fs.readFileSync(htmlPath, "utf-8");
        htmlStr = htmlStr.replace(
          "window.__DEEPEVAL_DATA__ = null; // INJECT_DEEPEVAL_DATA_HERE",
          `window.__DEEPEVAL_DATA__ = ${evalDataStr}; // INJECT_DEEPEVAL_DATA_HERE`
        );
        fs.writeFileSync(htmlPath, htmlStr);
        consoleLog("DEEPEVAL — Injected results into summary.html");
      }
    }
  } catch (e: any) {
    consoleLog(`DEEPEVAL — Evaluation failed: ${e.message}`);
  }
}

main().catch(console.error);
