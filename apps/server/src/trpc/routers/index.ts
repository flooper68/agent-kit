import { router } from '../trpc';
import { greetingRouter } from './greeting';
import { membersRouter } from './members';
import { agentsRouter } from './agents';
import { sessionsRouter } from './sessions';
import { messagesRouter } from './messages';

export const appRouter = router({
  greeting: greetingRouter,
  members: membersRouter,
  agents: agentsRouter,
  sessions: sessionsRouter,
  messages: messagesRouter,
});

export type AppRouter = typeof appRouter;
