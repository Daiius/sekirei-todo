import { tasks } from 'database/db/schema'
import { db } from 'database/db'
import { and, eq } from 'drizzle-orm'

import { createInsertSchema, createUpdateSchema } from 'drizzle-zod'
import { z } from 'zod/v4'

export type ApiResult<T> =
  | { success: true, data: T }
  | { success: false, error: { message: string, statusCode: number; } }

export type Task = typeof tasks.$inferSelect

export const getTasks = async (userId: string): Promise<ApiResult<Task[]>> => {
  try { 
    const result = await db.query.tasks.findMany({
      where: eq(tasks.userId, userId),
    })
    return {
      success: true,
      data: result,
    }
  } catch (err) {
    console.error('error @ getTasks: ', err)
    return {
      success: false,
      error: {
        message: String(err),
        statusCode: 500,
      }
    }
  }
}

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
): Promise<ApiResult<NewTask>> => {
  try {
    await db.insert(tasks).values({ ...newTask, userId });
    return {
      success: true,
      data: newTask,
    }
  } catch (err) {
    console.error('error @ addTask: ', err)
    return {
      success: false,
      error: {
        message: String(err),
        statusCode: 500,
      }
    }
  }
}

export const updateTask = async (updatedTask: UpdatedTask): Promise<ApiResult<UpdatedTask>> => {
  try {
    await db.update(tasks).set(updatedTask).where(
      and(
        eq(tasks.id, updatedTask.id),
        eq(tasks.userId, updatedTask.userId),
      )
    )
    return {
      success:true,
      data: updatedTask
    }
  } catch (err) {
    console.error('error @ updateTask: ', err)
    return {
      success: false,
      error: {
        message: String(err),
        statusCode: 500,
      }
    }
  }
}
