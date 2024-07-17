'use server'

import { auth } from '../auth';

import { db } from '@/db';
import { tasks } from '@/db/schema';
import { eq, and } from 'drizzle-orm';

type PartialBesides<T, K extends keyof T> = Partial<Omit<T, K>> & Pick<T, K>; 

export const getTasks = async () => db.select().from(tasks);

export const addTask = async (
  params: Omit<typeof tasks.$inferInsert, 'id'|'createdAt'|'userId'>
) => {
  const session = await auth();
  if (session?.user?.name == null) {
    throw Error('Failed to get user information');
  } 
  await db.insert(tasks).values(
    { ...params, userId: session.user.name }
  );
  return params;
}


export const mutateTask = async ({
  id,
  ...params
}: PartialBesides<
  Omit<typeof tasks.$inferSelect, 'userId'>,
  'id'
>) => {
  const session = await auth();
  if (session?.user?.name == null) {
    throw Error('Failed to get user information');
  }
  await db
    .update(tasks)
    .set(params)
    .where(
      and(
        eq(tasks.id, id),
        eq(tasks.userId, session.user.name),
      ),
    );
}

