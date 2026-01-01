import { router } from '../trpc';
import { greetingRouter } from './greeting';
import { membersRouter } from './members';

export const appRouter = router({
  greeting: greetingRouter,
  members: membersRouter,
});

export type AppRouter = typeof appRouter;
