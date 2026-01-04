import { eq } from 'drizzle-orm';
import type { db as DbType } from '../../../db';
import { agentSessions, type AgentSessionUsage } from '../../../db/schema';
import { calculateCost } from '../pricing';

export interface UpdateSessionUsageInput {
  sessionId: string;
  promptTokens: number;
  completionTokens: number;
  latency?: number;
  model?: string;
  provider?: string;
}

export class UpdateSessionUsageCommand {
  private db: typeof DbType;

  constructor(db: typeof DbType) {
    this.db = db;
  }

  async execute(input: UpdateSessionUsageInput): Promise<void> {
    const {
      sessionId,
      promptTokens,
      completionTokens,
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
      promptTokens: (currentUsage?.promptTokens || 0) + promptTokens,
      completionTokens:
        (currentUsage?.completionTokens || 0) + completionTokens,
      totalTokens: (currentUsage?.totalTokens || 0) + totalTokens,
      estimatedCost:
        (currentUsage?.estimatedCost || 0) +
        calculateCost(model, promptTokens, completionTokens),
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
