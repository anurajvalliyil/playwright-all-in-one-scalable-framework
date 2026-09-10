import { consoleLog } from "./logger.js";
import { TOKEN_BUDGET_CEILING } from "../config/models.js";

class TokenBudgetManager {
  private totalTokens = 0;
  private maxTokens = TOKEN_BUDGET_CEILING;

  public addUsage(tokens: number) {
    this.totalTokens += tokens;
  }

  public getTotal(): number {
    return this.totalTokens;
  }

  public getEstimatedCost(): number {
    // Rough estimation: $0.50 per 1M tokens
    return (this.totalTokens / 1000000) * 0.5;
  }

  public checkBudget(): boolean {
    if (this.totalTokens > this.maxTokens) {
      consoleLog(`BUDGET EXCEEDED! Used ${this.totalTokens}, max is ${this.maxTokens}`);
      return false;
    }
    return true;
  }
}

export const tokenBudget = new TokenBudgetManager();
