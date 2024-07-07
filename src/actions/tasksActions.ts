'use server'

import { auth } from '../auth';

import { db } from '@/db';
import { tasks } from '@/db/schema';

export const getTasks = async () => db.select().from(tasks);

export const addTask = async (
  params: Omit<typeof tasks.$inferInsert, 'id'|'createdAt'|'userId'>,
) => {
  const session = await auth();
  console.log(session);
  if (session?.user?.name == null) throw Error('Failed to get user information'); 
  await db.insert(tasks).values(
    { ...params, userId: session.user.name }
  );
  console.log('data added!');
  return params;
}

