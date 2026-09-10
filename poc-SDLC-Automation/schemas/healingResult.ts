import { z } from "zod";

export const LocatorPatchSchema = z.object({
  original: z.string(),
  replacement: z.string(),
  confidence: z.number()
});

export const HealingResultSchema = z.object({
  healed: z.boolean(),
  patch: LocatorPatchSchema.optional(),
  attempts: z.number()
});

export type LocatorPatch = z.infer<typeof LocatorPatchSchema>;
export type HealingResult = z.infer<typeof HealingResultSchema>;
