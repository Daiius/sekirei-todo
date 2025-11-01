import { Hono } from 'hono'
import {
  addTask,
  deleteTask,
  getTasks,
  NewTaskSchema,
  UpdatedTaskSchema,
  updateTask,
} from './lib'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod/v4'

export const app = new Hono()

const route = app
  .get('/users/:userId/tasks', async c => {
    const userId = c.req.param('userId')
    const result = await getTasks(userId)

    return result.success 
      ? c.json(result.data, 200)
      : c.body(null, result.error.statusCode)
  })
  .patch(
    '/users/:userId/tasks/:taskId',
    zValidator(
      'json',
      UpdatedTaskSchema,
    ),
    zValidator(
      'param',
      z.object({
        userId: z.string(),
        taskId: z.number(),
      })
    ),
    async c => {
      const { userId, taskId } = c.req.valid('param')
      const updatedTask = c.req.valid('json')

      if ( userId !== updatedTask.userId
        || taskId !== updatedTask.id
      ) {
        return c.body(null, 400)
      }
    
      const result = await updateTask(updatedTask)

      return result.success
        ? c.json(result.data, 200)
        : c.body(null, result.error.statusCode)
    }
  )
  .post(
    '/users/:userId/tasks',
    zValidator('json', NewTaskSchema),
    zValidator('param', z.object({ userId: z.string() })),
    async c => {
      const { userId } = c.req.valid('param')
      const newTask = c.req.valid('json')

      const result = await addTask(newTask, userId)

      return result.success
        ? c.json(result.data, 200)
        : c.body(null, result.error.statusCode)
    }
  )
  .delete(
    '/users/:userId/tasks/:taskId',
    zValidator('param', z.object({ userId: z.string(), taskId: z.number() }) ),
    async c => {
      const { userId, taskId } = c.req.valid('param')
      const result = await deleteTask(userId, taskId)
      return result.success
        ? c.body(null, 200)
        : c.body(null, result.error.statusCode) 
    }
  )

export type AppType = typeof route
