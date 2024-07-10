import { procedure, router, createCallerFactory } from './trpc';
import { taskRouter } from './routers/taskRouter';

export const appRouter = router({
  hello: procedure.query(() => {
    return { msg: 'Hello, tRPC' }
  }),
  task: taskRouter,
});

export type AppRouter = typeof appRouter;

export const createCaller = createCallerFactory(appRouter);

