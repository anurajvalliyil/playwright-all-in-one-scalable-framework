import { z } from "zod";

export const AgentMessageSchema = z.object({
  type: z.string(),
  payload: z.unknown(),
});
export type AgentMessage = z.infer<typeof AgentMessageSchema>;
