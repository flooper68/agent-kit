import { eq, and, asc } from 'drizzle-orm';
import type { db as DbType } from '../../../db';
import { artifacts, artifactTags, type Artifact } from '../../../db/schema';
import { deduplicateTags } from '../../shared/schemas';

export interface UpdateArtifactInput {
  id: string;
  userId: string;
  orgId: string;
  title?: string;
  content?: string;
  summary?: string;
  format?: 'markdown';
  tags?: string[];
}

export interface ArtifactWithTags extends Artifact {
  tags: string[];
}

export type UpdateArtifactResult = ArtifactWithTags | undefined;

export class UpdateArtifactCommand {
  private db: typeof DbType;

  constructor(db: typeof DbType) {
    this.db = db;
  }

  async execute(input: UpdateArtifactInput): Promise<UpdateArtifactResult> {
    const { id, userId, orgId, title, content, summary, format, tags } = input;

    // Build update object with only provided fields
    const updateData: Partial<{
      title: string;
      content: string;
      summary: string;
      format: 'markdown';
      sizeBytes: number;
      updatedAt: Date;
    }> = {
      updatedAt: new Date(),
    };

    if (title !== undefined) {
      updateData.title = title;
    }
    if (content !== undefined) {
      updateData.content = content;
      updateData.sizeBytes = Buffer.byteLength(content, 'utf8');
    }
    if (summary !== undefined) {
      updateData.summary = summary;
    }
    if (format !== undefined) {
      updateData.format = format;
    }

    return this.db.transaction(async (tx) => {
      const [updated] = await tx
        .update(artifacts)
        .set(updateData)
        .where(
          and(
            eq(artifacts.id, id),
            eq(artifacts.userId, userId),
            eq(artifacts.orgId, orgId)
          )
        )
        .returning();

      if (!updated) {
        return undefined;
      }

      // Update tags in junction table if provided
      if (tags !== undefined) {
        const dedupedTags = deduplicateTags(tags);

        // Delete existing tags
        await tx.delete(artifactTags).where(eq(artifactTags.artifactId, id));

        // Insert new tags
        if (dedupedTags.length > 0) {
          await tx.insert(artifactTags).values(
            dedupedTags.map((tag) => ({
              artifactId: id,
              tag,
            }))
          );
        }
      }

      // Fetch current tags to return with the artifact
      const currentTags = await tx
        .select({ tag: artifactTags.tag })
        .from(artifactTags)
        .where(eq(artifactTags.artifactId, id))
        .orderBy(asc(artifactTags.tag));

      return {
        ...updated,
        tags: currentTags.map((t) => t.tag),
      };
    });
  }
}
