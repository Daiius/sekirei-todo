import { router, procedure } from '../trpc';
import { tasks } from '@/db/schema';
import { db } from '@/db';
import { eq } from 'drizzle-orm';
import { auth } from '@/auth';
import { z } from 'zod';

export const taskRouter = router({
  getTasks: procedure.query(async () => {
    const session = await auth();
    if (session?.user?.name != null) {
      return await db
        .select()
        .from(tasks)
        .where(
          eq(
            tasks.userId,
            session.user.name
          )
        );
    }
  }),
  editTask: procedure
    .input(z.object({ 
      taskId: z.number(), 
      newDescription: z.string(),
    }))
    .mutation(async (opts) => {
      const session = await auth();
      if (session?.user?.name != null) {
        const { input } = opts;
        return await db
          .update(tasks)
          .set({ description: input.newDescription })
          .where(
            eq(
              tasks.id,
              input.taskId,
            )
          );
      }
    })
});

