import { relations } from 'drizzle-orm/relations';
import { agentSessions } from './agent-sessions';
import { agentSessionMessages } from './agent-session-messages';
import { agentSessionEvents } from './agent-session-events';
import { projects } from './projects';
import { tasks } from './tasks';
import { taskArtifacts } from './task-artifacts';
import { projectArtifacts } from './project-artifacts';
import { artifacts, artifactTags } from './artifacts';
import {
  serverAgents,
  externalAgents,
  serverAgentAllowedSubagents,
  externalAgentAllowedSubagents,
} from './agents';
import { googleDriveConnections } from './google-drive-connections';
import { artifactDriveSync } from './artifact-drive-sync';

export const agentSessionMessagesRelations = relations(
  agentSessionMessages,
  ({ one, many }) => ({
    agentSession: one(agentSessions, {
      fields: [agentSessionMessages.sessionId],
      references: [agentSessions.id],
    }),
    agentSessionEvents: many(agentSessionEvents),
  })
);

export const agentSessionsRelations = relations(agentSessions, ({ many }) => ({
  agentSessionMessages: many(agentSessionMessages),
  agentSessionEvents: many(agentSessionEvents),
}));

export const agentSessionEventsRelations = relations(
  agentSessionEvents,
  ({ one }) => ({
    agentSession: one(agentSessions, {
      fields: [agentSessionEvents.sessionId],
      references: [agentSessions.id],
    }),
    agentSessionMessage: one(agentSessionMessages, {
      fields: [agentSessionEvents.messageId],
      references: [agentSessionMessages.id],
    }),
  })
);

export const tasksRelations = relations(tasks, ({ one, many }) => ({
  project: one(projects, {
    fields: [tasks.projectId],
    references: [projects.id],
  }),
  taskArtifacts: many(taskArtifacts),
}));

export const projectsRelations = relations(projects, ({ many }) => ({
  tasks: many(tasks),
  projectArtifacts: many(projectArtifacts),
}));

export const taskArtifactsRelations = relations(taskArtifacts, ({ one }) => ({
  task: one(tasks, {
    fields: [taskArtifacts.taskId],
    references: [tasks.id],
  }),
  artifact: one(artifacts, {
    fields: [taskArtifacts.artifactId],
    references: [artifacts.id],
  }),
}));

export const projectArtifactsRelations = relations(
  projectArtifacts,
  ({ one }) => ({
    project: one(projects, {
      fields: [projectArtifacts.projectId],
      references: [projects.id],
    }),
    artifact: one(artifacts, {
      fields: [projectArtifacts.artifactId],
      references: [artifacts.id],
    }),
  })
);

export const artifactsRelations = relations(artifacts, ({ many }) => ({
  taskArtifacts: many(taskArtifacts),
  projectArtifacts: many(projectArtifacts),
  artifactTags: many(artifactTags),
  artifactDriveSync: many(artifactDriveSync),
}));

export const artifactTagsRelations = relations(artifactTags, ({ one }) => ({
  artifact: one(artifacts, {
    fields: [artifactTags.artifactId],
    references: [artifacts.id],
  }),
}));

// Server agent relations
export const serverAgentsRelations = relations(serverAgents, ({ many }) => ({
  allowedSubagents: many(serverAgentAllowedSubagents),
}));

// External agent relations
export const externalAgentsRelations = relations(
  externalAgents,
  ({ many }) => ({
    allowedSubagents: many(externalAgentAllowedSubagents),
  })
);

// Server agent allowed subagents relations
export const serverAgentAllowedSubagentsRelations = relations(
  serverAgentAllowedSubagents,
  ({ one }) => ({
    serverAgent: one(serverAgents, {
      fields: [serverAgentAllowedSubagents.serverAgentId],
      references: [serverAgents.id],
    }),
    allowedServerAgent: one(serverAgents, {
      fields: [serverAgentAllowedSubagents.allowedServerAgentId],
      references: [serverAgents.id],
    }),
    allowedExternalAgent: one(externalAgents, {
      fields: [serverAgentAllowedSubagents.allowedExternalAgentId],
      references: [externalAgents.id],
    }),
  })
);

// External agent allowed subagents relations
export const externalAgentAllowedSubagentsRelations = relations(
  externalAgentAllowedSubagents,
  ({ one }) => ({
    externalAgent: one(externalAgents, {
      fields: [externalAgentAllowedSubagents.externalAgentId],
      references: [externalAgents.id],
    }),
    allowedServerAgent: one(serverAgents, {
      fields: [externalAgentAllowedSubagents.allowedServerAgentId],
      references: [serverAgents.id],
    }),
    allowedExternalAgent: one(externalAgents, {
      fields: [externalAgentAllowedSubagents.allowedExternalAgentId],
      references: [externalAgents.id],
    }),
  })
);

// Google Drive connections relations
export const googleDriveConnectionsRelations = relations(
  googleDriveConnections,
  ({ many }) => ({
    artifactDriveSync: many(artifactDriveSync),
  })
);

// Artifact Drive sync relations
export const artifactDriveSyncRelations = relations(
  artifactDriveSync,
  ({ one }) => ({
    artifact: one(artifacts, {
      fields: [artifactDriveSync.artifactId],
      references: [artifacts.id],
    }),
    connection: one(googleDriveConnections, {
      fields: [artifactDriveSync.connectionId],
      references: [googleDriveConnections.id],
    }),
  })
);
