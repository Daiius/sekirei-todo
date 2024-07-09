import { router, procedure } from '../trpc';
import { tasks } from '@/db/schema';
import { db } from '@/db';
import { eq } from 'drizzle-orm';
import { auth } from '@/auth';

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
  })
});

