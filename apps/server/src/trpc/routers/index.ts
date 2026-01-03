import { router } from '../trpc';
import { greetingRouter } from './greeting';
import { membersRouter } from './members';
import { agentsRouter } from './agents';
import { sessionsRouter } from './sessions';
import { messagesRouter } from './messages';
import { analyticsRouter } from './analytics';

export const appRouter = router({
  greeting: greetingRouter,
  members: membersRouter,
  agents: agentsRouter,
  sessions: sessionsRouter,
  messages: messagesRouter,
  analytics: analyticsRouter,
});

export type AppRouter = typeof appRouter;
