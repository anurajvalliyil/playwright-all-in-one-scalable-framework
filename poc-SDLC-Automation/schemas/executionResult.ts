import { z } from "zod";

export const StepResultSchema = z.object({
  id: z.string(),
  description: z.string(),
  status: z.enum(["passed", "failed", "repaired", "skipped"]),
  durationMs: z.number(),
  error: z.string().optional()
});

export const UIExecutionResultSchema = z.object({
  passed: z.boolean(),
  steps: z.array(StepResultSchema),
  screenshots: z.array(z.string()),
  failedStep: StepResultSchema.optional()
});

export const APICallResultSchema = z.object({
  stepId: z.string(),
  endpoint: z.string(),
  method: z.string(),
  statusCode: z.number(),
  passed: z.boolean(),
  durationMs: z.number(),
  error: z.string().optional()
});

export const APIExecutionResultSchema = z.object({
  passed: z.boolean(),
  calls: z.array(APICallResultSchema),
  schemaViolations: z.array(z.string())
});

export type StepResult = z.infer<typeof StepResultSchema>;
export type UIExecutionResult = z.infer<typeof UIExecutionResultSchema>;
export type APICallResult = z.infer<typeof APICallResultSchema>;
export type APIExecutionResult = z.infer<typeof APIExecutionResultSchema>;
