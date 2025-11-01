'use server'

import { auth } from '../auth';

import { db } from 'database/db';
import { tasks } from 'database/db/schema';
import { eq, and } from 'drizzle-orm';

type PartialBesides<T, K extends keyof T> = Partial<Omit<T, K>> & Pick<T, K>; 

const getUserId = async (): Promise<string> => {
  const session = await auth();
  if (session?.user?.id == null) {
    throw new Error('cannot get user information');
  }
  return session?.user?.id;
}

export const getTasks = async () => {
  const userId = await getUserId();
  return await db
    .select()
    .from(tasks)
    .where(
      eq(
        tasks.userId, 
        userId
      )
    );
}

export const addTask = async (
  params: Omit<typeof tasks.$inferInsert, 'id'|'createdAt'|'userId'>
) => {
  const userId = await getUserId();
  await db.insert(tasks).values(
    { ...params, userId }
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
  const userId = await getUserId();
  await db
    .update(tasks)
    .set(params)
    .where(
      and(
        eq(tasks.id, id),
        eq(tasks.userId, userId),
      ),
    );
}

export const deleteTask = async (id: number) => {
  const userId = await getUserId();
  await db
    .delete(tasks)
    .where(
      and(
        eq(tasks.id, id),
        eq(tasks.userId, userId)
      )
    );
}

