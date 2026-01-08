import { eq, and } from 'drizzle-orm';
import type { db as DbType } from '../../../db';
import { artifacts, type Artifact } from '../../../db/schema';

export interface UpdateArtifactInput {
  id: string;
  userId: string;
  orgId: string;
  title?: string;
  content?: string;
  summary?: string;
  format?: 'markdown';
}

export type UpdateArtifactResult = Artifact | undefined;

export class UpdateArtifactCommand {
  private db: typeof DbType;

  constructor(db: typeof DbType) {
    this.db = db;
  }

  async execute(input: UpdateArtifactInput): Promise<UpdateArtifactResult> {
    const { id, userId, orgId, title, content, summary, format } = input;

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

    const [updated] = await this.db
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

    return updated;
  }
}
