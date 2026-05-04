import { db } from './index'
import { tasks, account } from './schema'
import { and, eq } from 'drizzle-orm'
import { z } from 'zod/v4'


import { createInsertSchema, createUpdateSchema } from 'drizzle-zod'

export type Task = typeof tasks.$inferSelect
export type NewTask = z.infer<typeof NewTaskSchema>
export type UpdatedTask = z.infer<typeof UpdatedTaskSchema>

// session.user.id (better-auth UUID) に紐づいた GitHub の numeric id を返す。
// 見つからなければ undefined。tasks.userId はこの id を保持している。
export const getGitHubAccountId = async (userId: string): Promise<string | undefined> => {
  const [row] = await db
    .select({ accountId: account.accountId })
    .from(account)
    .where(and(
      eq(account.userId, userId),
      eq(account.providerId, 'github'),
    ))
    .limit(1)
  return row?.accountId
}

export const getTasks = async (userId: string) =>
  await db.query.tasks.findMany({ where: { userId } })

export const insertTask = async (userId: string, newTask: NewTask) =>
  await db.insert(tasks).values({ ...newTask, userId });

export const updateTask = async (updatedTask: UpdatedTask) =>
  await db.update(tasks).set(updatedTask).where(
    and(
      eq(tasks.id, updatedTask.id),
      eq(tasks.userId, updatedTask.userId),
    )
  )
export const deleteTask = async (userId: string, taskId: number) =>
  await db.delete(tasks).where(
    and(
      eq(tasks.id, taskId),
      eq(tasks.userId, userId),
    )
  )

export const NewTaskSchema = createInsertSchema(tasks)
  .omit({ 
    id: true,
    createdAt: true,
    userId: true,
  })

export const UpdatedTaskSchema = createUpdateSchema(tasks)
.required({ id: true, userId: true })
