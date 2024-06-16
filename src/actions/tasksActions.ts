'use server'

import { cookies } from 'next/headers';

import { db } from '@/db';
import { tasks } from '@/db/schema';

export const GetTasksActionKey = '/action/tasks' as const;

export const getTasks = async () => db.select().from(tasks);

export const addTask = async (
  params: Omit<typeof tasks.$inferInsert, 'id'|'createdAt'>,
) => {
  await db.insert(tasks).values(params);
  console.log('data added!');
  return params;
}

