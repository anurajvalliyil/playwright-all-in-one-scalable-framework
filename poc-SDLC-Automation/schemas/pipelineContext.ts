import { z } from "zod";
import { TestCaseSchema, TestSuiteSchema } from "./testCase.js";
import { UIExecutionResultSchema, APIExecutionResultSchema } from "./executionResult.js";

export const PipelineContextSchema = z.object({
  goal: z.string(),
  suites: z.array(TestSuiteSchema),
  testCases: z.array(TestCaseSchema),
  dataContext: z.record(z.any()),
  results: z.record(
    z.object({
      ui: UIExecutionResultSchema.optional(),
      api: APIExecutionResultSchema.optional(),
      status: z.enum(["passed", "failed", "blocked"])
    })
  ),
  requirements: z.any().optional(),
  plan: z.any().optional(),
  data: z.any().optional(),
  validation: z.any().optional()
});

export type PipelineContext = z.infer<typeof PipelineContextSchema>;
