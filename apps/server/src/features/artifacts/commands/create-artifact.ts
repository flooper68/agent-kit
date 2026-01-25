import type { db as DbType } from '../../../db';
import { artifacts, artifactTags, type Artifact } from '../../../db/schema';
import { deduplicateTags } from '../../shared/schemas';

export interface CreateArtifactInput {
  userId: string;
  orgId: string;
  title: string;
  content: string;
  format?: 'markdown';
  sessionId?: string;
  agentId?: string;
  summary?: string;
  tags?: string[];
}

export interface ArtifactWithTags extends Artifact {
  tags: string[];
}

export type CreateArtifactResult = ArtifactWithTags;

export class CreateArtifactCommand {
  private db: typeof DbType;

  constructor(db: typeof DbType) {
    this.db = db;
  }

  async execute(input: CreateArtifactInput): Promise<CreateArtifactResult> {
    const sizeBytes = Buffer.byteLength(input.content, 'utf8');
    const tags = input.tags ? deduplicateTags(input.tags) : [];

    return this.db.transaction(async (tx) => {
      const [artifact] = await tx
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

      // Insert tags into junction table
      if (tags.length > 0) {
        await tx.insert(artifactTags).values(
          tags.map((tag) => ({
            artifactId: artifact.id,
            tag,
          }))
        );
      }

      return {
        ...artifact,
        tags,
      };
    });
  }
}
