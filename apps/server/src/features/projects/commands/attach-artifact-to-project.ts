import { eq, and } from 'drizzle-orm';
import type { db as DbType } from '../../../db';
import { projects, projectArtifacts, artifacts } from '../../../db/schema';

export interface AttachArtifactToProjectInput {
  projectId: string;
  artifactId: string;
  userId: string;
  orgId: string;
}

export interface AttachArtifactToProjectResult {
  success: boolean;
  alreadyAttached: boolean;
}

export class AttachArtifactToProjectCommand {
  private db: typeof DbType;

  constructor(db: typeof DbType) {
    this.db = db;
  }

  async execute(
    input: AttachArtifactToProjectInput
  ): Promise<AttachArtifactToProjectResult> {
    const { projectId, artifactId, userId, orgId } = input;

    return await this.db.transaction(async (tx) => {
      // Verify project ownership
      const [project] = await tx
        .select({ id: projects.id })
        .from(projects)
        .where(
          and(
            eq(projects.id, projectId),
            eq(projects.userId, userId),
            eq(projects.orgId, orgId)
          )
        )
        .limit(1);

      if (!project) {
        throw new Error('Project not found or access denied');
      }

      // Verify artifact ownership
      const [artifact] = await tx
        .select({ id: artifacts.id })
        .from(artifacts)
        .where(
          and(
            eq(artifacts.id, artifactId),
            eq(artifacts.userId, userId),
            eq(artifacts.orgId, orgId)
          )
        )
        .limit(1);

      if (!artifact) {
        throw new Error('Artifact not found or access denied');
      }

      // Use INSERT ... ON CONFLICT DO NOTHING for atomic upsert
      const result = await tx
        .insert(projectArtifacts)
        .values({
          projectId,
          artifactId,
        })
        .onConflictDoNothing()
        .returning();

      return {
        success: true,
        alreadyAttached: result.length === 0,
      };
    });
  }
}
