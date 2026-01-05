import { router } from '../trpc';
import { greetingRouter } from './greeting';
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
import { localAgentsRouter } from './local-agents';

export const appRouter = router({
  greeting: greetingRouter,
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
  localAgents: localAgentsRouter,
});

export type AppRouter = typeof appRouter;
