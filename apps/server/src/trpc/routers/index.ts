import { router } from '../trpc';
import { membersRouter } from './members';
import { agentsRouter } from './agents';
import { sessionsRouter } from './sessions';
import { messagesRouter } from './messages';
import { analyticsRouter } from './analytics';
import { artifactsRouter } from './artifacts';
import { projectsRouter } from './projects';
import { tasksRouter } from './tasks';
import { cacheRouter } from './cache';
import { clientToolsRouter } from './client-tools';

export const appRouter = router({
  members: membersRouter,
  agents: agentsRouter,
  sessions: sessionsRouter,
  messages: messagesRouter,
  analytics: analyticsRouter,
  artifacts: artifactsRouter,
  projects: projectsRouter,
  tasks: tasksRouter,
  cache: cacheRouter,
  clientTools: clientToolsRouter,
});

export type AppRouter = typeof appRouter;
