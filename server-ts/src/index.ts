import { serve } from '@hono/node-server'
import { Hono } from 'hono'
import {
  getTasks,
  UpdatedTaskSchema,
  updateTask,
} from './lib'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod/v4'

const app = new Hono()

const route = app
  .get('/', (c) => {
    return c.text('Hello Hono!')
  })
  .get('/users/:userId/tasks', async c => {
    const userId = c.req.param('userId')
    const tasks = await getTasks(userId)
    return c.json(tasks, 200)
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
      return c.json(result, 200)
    }
  )

export type AppType = typeof route

serve({
  fetch: app.fetch,
  port: 4000
}, (info) => {
  console.log(`Server is running on http://localhost:${info.port}`)
})
