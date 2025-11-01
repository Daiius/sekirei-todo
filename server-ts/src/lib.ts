import { tasks } from 'database/db/schema'
import { db } from 'database/db'
import { and, eq } from 'drizzle-orm'

import { createInsertSchema, createUpdateSchema } from 'drizzle-zod'
import { z } from 'zod/v4'

export const getTasks = async (userId: string) => 
  await db.query.tasks.findMany({
    where: eq(tasks.userId, userId),
  })

export const NewTaskSchema = createInsertSchema(tasks)
  .omit({ 
    id: true,
    createdAt: true,
    userId: true,
  })

export const UpdatedTaskSchema = createUpdateSchema(tasks)
  .required({ id: true, userId: true })

export type NewTask = z.infer<typeof NewTaskSchema>
export type UpdatedTask = z.infer<typeof UpdatedTaskSchema>

export const addTask = async (
  newTask: NewTask,
  userId: string,
) => {
  await db.insert(tasks).values({ ...newTask, userId });
  return newTask;
}

export const updateTask = async (updatedTask: UpdatedTask) => {
  await db.update(tasks).set(updatedTask).where(
    and(
      eq(tasks.id, updatedTask.id),
      eq(tasks.userId, updatedTask.userId),
    )
  )
  return updatedTask
}
