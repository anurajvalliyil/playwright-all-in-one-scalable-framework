import { z } from "zod";

export const TestCaseSchema = z.object({
  id: z.string(),
  suiteId: z.string(),
  title: z.string(),
  steps: z.array(z.string()),
  targetApp: z.enum(["ui", "api", "both"]),
  dataRequirements: z.array(z.string()),
  assertionHints: z.array(z.string()),
  tags: z.array(z.string()).optional()
});

export const TestSuiteSchema = z.object({
  id: z.string(),
  title: z.string(),
  priority: z.enum(["high", "medium", "low"]),
  targetApp: z.enum(["ui", "api", "both"])
});

export type TestCase = z.infer<typeof TestCaseSchema>;
export type TestSuite = z.infer<typeof TestSuiteSchema>;
