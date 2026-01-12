import { eq, and } from 'drizzle-orm';
import type { db as DbType } from '../../../db';
import { artifacts, type Artifact } from '../../../db/schema';

export interface PatchArtifactInput {
  id: string;
  userId: string;
  orgId: string;
  startLine: number; // 1-indexed, inclusive
  endLine: number; // 1-indexed, inclusive
  newContent: string; // Content to replace the line range with
}

export type PatchArtifactResult = Artifact | undefined;

export class PatchArtifactCommand {
  private db: typeof DbType;

  constructor(db: typeof DbType) {
    this.db = db;
  }

  async execute(input: PatchArtifactInput): Promise<PatchArtifactResult> {
    const { id, userId, orgId, startLine, endLine, newContent } = input;

    // First, fetch the current artifact to get its content
    const [existing] = await this.db
      .select({ content: artifacts.content })
      .from(artifacts)
      .where(
        and(
          eq(artifacts.id, id),
          eq(artifacts.userId, userId),
          eq(artifacts.orgId, orgId)
        )
      )
      .limit(1);

    if (!existing) {
      return undefined;
    }

    // Split content into lines
    const lines = existing.content.split('\n');
    const totalLines = lines.length;

    // Validate line range (1-indexed)
    if (startLine < 1) {
      throw new Error(`startLine must be at least 1, got ${startLine}`);
    }
    if (startLine > totalLines + 1) {
      throw new Error(
        `startLine ${startLine} is out of range (max ${totalLines + 1} for insert at end)`
      );
    }
    if (endLine < startLine - 1) {
      throw new Error(
        `endLine ${endLine} must be at least startLine - 1 (${startLine - 1})`
      );
    }
    if (endLine > totalLines) {
      throw new Error(`endLine ${endLine} is out of range (max ${totalLines})`);
    }

    // Convert to 0-indexed for splice
    const startIndex = startLine - 1;
    const deleteCount = Math.max(0, endLine - startLine + 1);

    // Split new content into lines (empty string = no new lines to insert)
    const newLines = newContent ? newContent.split('\n') : [];

    // Apply the patch
    lines.splice(startIndex, deleteCount, ...newLines);

    // Join back into content
    const patchedContent = lines.join('\n');

    // Update the artifact with new content
    const [updated] = await this.db
      .update(artifacts)
      .set({
        content: patchedContent,
        sizeBytes: Buffer.byteLength(patchedContent, 'utf8'),
        updatedAt: new Date(),
      })
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
