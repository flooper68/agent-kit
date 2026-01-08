import type { db as DbType } from '../../../db';
import { artifacts, type Artifact } from '../../../db/schema';

export interface CreateArtifactInput {
  userId: string;
  orgId: string;
  title: string;
  content: string;
  format?: 'markdown';
  sessionId?: string;
  agentId?: string;
  summary?: string;
}

export type CreateArtifactResult = Artifact;

export class CreateArtifactCommand {
  private db: typeof DbType;

  constructor(db: typeof DbType) {
    this.db = db;
  }

  async execute(input: CreateArtifactInput): Promise<CreateArtifactResult> {
    const sizeBytes = Buffer.byteLength(input.content, 'utf8');

    const [artifact] = await this.db
      .insert(artifacts)
      .values({
        userId: input.userId,
        orgId: input.orgId,
        title: input.title,
        content: input.content,
        format: input.format ?? 'markdown',
        sessionId: input.sessionId,
        agentId: input.agentId,
        summary: input.summary ?? `Document titled "${input.title}"`,
        sizeBytes,
      })
      .returning();

    if (!artifact) {
      throw new Error('Failed to create artifact');
    }

    return artifact;
  }
}
