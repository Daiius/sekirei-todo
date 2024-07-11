import { router, protectedProcedure } from '../trpc';
import { tasks } from '@/db/schema';
import { db } from '@/db';
import { eq } from 'drizzle-orm';
import { z } from 'zod';


export const taskRouter = router({
  getTasks: protectedProcedure.query(async (opts) =>
    await db
      .select()
      .from(tasks)
      .where(
        eq(
          tasks.userId,
          opts.ctx.userId,
        )
      )
  ),
  editTask: protectedProcedure
    .input(z.object({ 
      taskId: z.number(), 
      newDescription: z.string(),
    }))
    .mutation(async (opts) =>
      await db
        .update(tasks)
        .set({ description: opts.input.newDescription })
        .where(
          eq(
            tasks.id,
            opts.input.taskId,
          )
        )
    )
});

