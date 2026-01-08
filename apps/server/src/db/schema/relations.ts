import { relations } from 'drizzle-orm/relations';
import { agentSessions } from './agent-sessions';
import { agentSessionMessages } from './agent-session-messages';
import { agentSessionEvents } from './agent-session-events';
import { projects } from './projects';
import { tasks } from './tasks';
import { taskArtifacts } from './task-artifacts';
import { artifacts } from './artifacts';

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

export const artifactsRelations = relations(artifacts, ({ many }) => ({
  taskArtifacts: many(taskArtifacts),
}));
