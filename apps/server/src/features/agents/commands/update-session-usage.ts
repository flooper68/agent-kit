import { eq } from 'drizzle-orm';
import type { db as DbType } from '../../../db';
import {
  agentSessions,
  type AgentSessionUsage,
  type TokenBreakdown,
} from '../../../db/schema';
import { calculateCost } from '../pricing';

export interface UpdateSessionUsageInput {
  sessionId: string;
  promptTokens: number;
  completionTokens: number;
  cacheReadTokens?: number;
  cacheWriteTokens?: number;
  /** Context window usage calculated from breakdown (more accurate than promptTokens for tool use) */
  contextWindowUsage?: number;
  tokenBreakdown?: TokenBreakdown;
  latency?: number;
  model?: string;
  provider?: string;
}

export type UpdateSessionUsageResult = void;

export class UpdateSessionUsageCommand {
  private db: typeof DbType;

  constructor(db: typeof DbType) {
    this.db = db;
  }

  async execute(input: UpdateSessionUsageInput): Promise<UpdateSessionUsageResult> {
    const {
      sessionId,
      promptTokens,
      completionTokens,
      cacheReadTokens,
      cacheWriteTokens,
      contextWindowUsage,
      tokenBreakdown,
      latency = 0,
      model = 'unknown',
      provider = 'unknown',
    } = input;

    const totalTokens = promptTokens + completionTokens;

    // Get current session to update usage
    const [session] = await this.db
      .select({
        usage: agentSessions.usage,
        messageCount: agentSessions.messageCount,
      })
      .from(agentSessions)
      .where(eq(agentSessions.id, sessionId));

    if (!session) return;

    const currentUsage = session.usage as AgentSessionUsage | null;
    const currentMessageCount = session.messageCount || 0;

    // Calculate new usage values
    const newUsage: AgentSessionUsage = {
      // Accumulated token counts (for billing)
      promptTokens: (currentUsage?.promptTokens || 0) + promptTokens,
      completionTokens:
        (currentUsage?.completionTokens || 0) + completionTokens,
      totalTokens: (currentUsage?.totalTokens || 0) + totalTokens,

      // Accumulated cache tokens (for billing insights)
      cacheReadTokens:
        (currentUsage?.cacheReadTokens || 0) + (cacheReadTokens ?? 0),
      cacheWriteTokens:
        (currentUsage?.cacheWriteTokens || 0) + (cacheWriteTokens ?? 0),

      // Current context snapshot (overwrite, not accumulate)
      // Use breakdown-calculated context window usage if available (more accurate for tool use)
      // Falls back to promptTokens for backwards compatibility
      currentContextTokens: contextWindowUsage ?? promptTokens,

      // Token breakdown for context visualization (snapshot, not accumulated)
      tokenBreakdown,

      // Cost calculation with cache pricing
      estimatedCost:
        (currentUsage?.estimatedCost || 0) +
        calculateCost(model, {
          promptTokens,
          completionTokens,
          cacheReadTokens,
          cacheWriteTokens,
        }),

      totalLatency: (currentUsage?.totalLatency || 0) + latency,
      averageLatency:
        currentMessageCount > 0
          ? ((currentUsage?.totalLatency || 0) + latency) /
            (currentMessageCount + 1)
          : latency,
      messageCount: currentMessageCount + 1,
      turnCount: Math.ceil((currentMessageCount + 1) / 2),
      lastModel: model,
      lastProvider: provider,
    };

    await this.db
      .update(agentSessions)
      .set({
        usage: newUsage,
        updatedAt: new Date(),
      })
      .where(eq(agentSessions.id, sessionId));
  }
}
