import { z } from 'zod';

export const ThinkingConfigSchema = z
  .object({
    enabled: z.boolean(),
    budgetTokens: z.number().min(1024).max(32768).optional(),
    reasoningEffort: z.enum(['low', 'medium', 'high']).optional(),
    thinkingLevel: z.enum(['minimal', 'low', 'medium', 'high']).optional(),
    thinkingBudget: z.number().min(-1).max(32768).optional(),
  })
  .nullable();
