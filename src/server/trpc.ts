/**
 * Initialization of tRPC backend
 * @link https://trpc.io/docs/server/routers
 */
import { initTRPC, TRPCError } from '@trpc/server';
import { auth } from '@/auth';

const t = initTRPC.create();

export const router = t.router;

export const procedure = t.procedure;

export const protectedProcedure = t.procedure.use(async ({ctx, next}) => {
  const session = await auth();
  if (session?.user?.name == null) {
    throw new TRPCError({ code: 'UNAUTHORIZED' });
  }

  return next({
    ctx: { userId: session?.user?.name }
  });
});

export const createCallerFactory = t.createCallerFactory;


