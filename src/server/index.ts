import { procedure, router, createCallerFactory } from './trpc';
import { taskRouter } from './routers/taskRouter';

import { auth } from '@/auth';

export const appRouter = router({
  hello: procedure.query(() => {
    return { msg: 'Hello, tRPC' }
  }),
  user: procedure.query(async () => await auth()),
  task: taskRouter,
});

export type AppRouter = typeof appRouter;

export const createCaller = createCallerFactory(appRouter);

