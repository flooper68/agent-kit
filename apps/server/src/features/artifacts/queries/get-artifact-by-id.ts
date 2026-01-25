import { eq, and, asc } from 'drizzle-orm';
import type { db as DbType } from '../../../db';
import {
  artifacts,
  artifactTags,
  projectArtifacts,
  projects,
  taskArtifacts,
  tasks,
  type Artifact,
} from '../../../db/schema';

export interface GetArtifactByIdInput {
  id: string;
  userId: string;
  orgId: string;
}

export interface AttachedProject {
  id: string;
  title: string;
}

export interface AttachedTask {
  id: string;
  title: string;
  projectId: string;
  projectTitle: string;
}

export interface ArtifactWithRelations extends Artifact {
  tags: string[];
  projects: AttachedProject[];
  tasks: AttachedTask[];
}

export type GetArtifactByIdResult = ArtifactWithRelations | undefined;

export class GetArtifactByIdQuery {
  private db: typeof DbType;

  constructor(db: typeof DbType) {
    this.db = db;
  }

  async execute(input: GetArtifactByIdInput): Promise<GetArtifactByIdResult> {
    const { id, userId, orgId } = input;
    const [artifact] = await this.db
      .select()
      .from(artifacts)
      .where(
        and(
          eq(artifacts.id, id),
          eq(artifacts.userId, userId),
          eq(artifacts.orgId, orgId)
        )
      )
      .limit(1);

    if (!artifact) {
      return undefined;
    }

    // Fetch attached projects, tasks, and tags in parallel
    const [attachedProjects, attachedTasks, tags] = await Promise.all([
      this.db
        .select({
          id: projects.id,
          title: projects.title,
        })
        .from(projectArtifacts)
        .innerJoin(projects, eq(projectArtifacts.projectId, projects.id))
        .where(eq(projectArtifacts.artifactId, id)),

      this.db
        .select({
          id: tasks.id,
          title: tasks.title,
          projectId: tasks.projectId,
          projectTitle: projects.title,
        })
        .from(taskArtifacts)
        .innerJoin(tasks, eq(taskArtifacts.taskId, tasks.id))
        .innerJoin(projects, eq(tasks.projectId, projects.id))
        .where(eq(taskArtifacts.artifactId, id)),

      this.db
        .select({ tag: artifactTags.tag })
        .from(artifactTags)
        .where(eq(artifactTags.artifactId, id))
        .orderBy(asc(artifactTags.tag)),
    ]);

    return {
      ...artifact,
      tags: tags.map((t) => t.tag),
      projects: attachedProjects,
      tasks: attachedTasks,
    };
  }
}
