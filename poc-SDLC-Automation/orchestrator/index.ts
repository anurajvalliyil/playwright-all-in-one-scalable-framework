import { consoleLog, logEvent } from "../core/logger.js";
import { SkillRegistry } from "../core/skillRegistry.js";
import { ExecutionPool } from "../core/executionPool.js";
import { PipelineContext } from "../schemas/pipelineContext.js";
import { tokenBudget } from "../core/tokenBudget.js";

import "../agents/requirementsAnalyst.js";
import "../agents/testPlanner.js";
import "../agents/testData.js";
import "../agents/uiExecutor.js";
import "../agents/apiExecutor.js";
import "../agents/selfHealing.js";
import "../agents/rootCauseAnalyst.js";
import "../agents/crossValidator.js";
import "../agents/reporter.js";

export class OrchestratorAgent {
  async execute(goalStr: string) {
    consoleLog(`PIPELINE START — goal received`);
    logEvent({ event: "pipeline_start", goal: goalStr });

    const context: PipelineContext = { goal: goalStr, suites: [], testCases: [], dataContext: {}, results: {} };

    const reqAnalyst = SkillRegistry.get("requirementsAnalyst")?.agentClass;
    const reqs = await reqAnalyst.execute(goalStr);
    context.suites = reqs.testSuite || [];
    context.requirements = reqs;

    if (!tokenBudget.checkBudget()) return;

    const testPlanner = SkillRegistry.get("testPlanner")?.agentClass;
    const plan = await testPlanner.execute(reqs);
    context.testCases = plan.testCases || [];
    context.plan = plan;

    if (!tokenBudget.checkBudget()) return;

    const testData = SkillRegistry.get("testData")?.agentClass;
    const data = await testData.execute(reqs);
    context.dataContext = data.dataContext || {};
    context.data = data;

    if (!tokenBudget.checkBudget()) return;

    consoleLog(`POOL — starting 3 concurrent execution slots`);
    const pool = new ExecutionPool(3);
    const executionPromises: Promise<any>[] = [];

    const uiExecutor = SkillRegistry.get("uiExecutor")?.agentClass;
    const apiExecutor = SkillRegistry.get("apiExecutor")?.agentClass;

    let slotCounter = 1;

    for (const tc of context.testCases) {
      executionPromises.push((async () => {
        await pool.acquire();
        const slot = slotCounter++;
        consoleLog(`SLOT ${slot} — ${tc.targetApp}_executor: ${tc.id} ${tc.title}`);
        logEvent({ event: "agent_start", agentName: `${tc.targetApp}Executor`, tcId: tc.id });

        try {
          let res: any;
          if (tc.targetApp === "ui") {
            res = await uiExecutor.execute(tc, context);
          } else {
            res = await apiExecutor.execute(tc, context);
          }

          context.results[tc.id] = { status: res.passed ? "passed" : "failed", [tc.targetApp]: res };
          if (res.passed) {
            consoleLog(`SLOT ${slot} — ${tc.id} PASSED ✅`);
          } else {
            consoleLog(`SLOT ${slot} — ${tc.id} FAILED ❌ (${res.failedStep?.error || 'unknown error'})`);
          }
        } catch (execError: any) {
          consoleLog(`SLOT ${slot} — ${tc.id} EXECUTION ERROR: ${execError.message}`);
          context.results[tc.id] = {
            status: "failed",
            [tc.targetApp]: {
              passed: false,
              steps: [{ id: "step_error", description: "Execution crashed", status: "failed", durationMs: 0, error: execError.message }],
              screenshots: [],
              failedStep: { id: "step_error", description: "Execution crashed", status: "failed", durationMs: 0, error: execError.message }
            }
          };
        }
        
        logEvent({ event: "agent_end", agentName: `${tc.targetApp}Executor`, tcId: tc.id });
        pool.release();
      })());
    }

    await Promise.allSettled(executionPromises);

    if (!tokenBudget.checkBudget()) return;

    const crossValidator = SkillRegistry.get("crossValidator")?.agentClass;
    try {
      context.validation = await crossValidator.execute(context);
    } catch (e: any) {
      consoleLog(`[Cross Validator] Error: ${e.message}`);
      context.validation = { matched: false, score: "0/0" };
    }

    // Collect actual failures for root cause analysis
    const failures = Object.entries(context.results)
      .filter(([_, r]: [string, any]) => r.status === "failed")
      .map(([tcId, r]: [string, any]) => ({
        tcId,
        error: r.ui?.failedStep?.error || r.api?.failedStep?.error || "unknown",
        step: r.ui?.failedStep?.description || r.api?.failedStep?.description || "unknown"
      }));

    const rca = SkillRegistry.get("rootCauseAnalyst")?.agentClass;
    try {
      if (failures.length > 0) {
        await rca.execute(failures);
      } else {
        consoleLog(`AGENT root_cause_analyst — skipped (no failures)`);
      }
    } catch (e: any) {
      consoleLog(`[Root Cause Analyst] Error: ${e.message}`);
    }

    const reporter = SkillRegistry.get("reporter")?.agentClass;
    await reporter.execute(context);

    let passedCount = 0;
    let failedCount = 0;
    Object.values(context.results).forEach((r: any) => {
      if (r.status === "passed") passedCount++;
      else failedCount++;
    });
    consoleLog(`PIPELINE COMPLETE — ${passedCount} passed, ${failedCount} failed`);
    consoleLog(`TOKEN USAGE — total: ${tokenBudget.getTotal()} tokens | est. cost: $${tokenBudget.getEstimatedCost().toFixed(3)}`);
    logEvent({ event: "pipeline_complete" });
  }
}
