import { Hono } from 'hono'
import { logger } from 'hono/logger'
import { cors } from 'hono/cors'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod/v4'

import {
  addTask,
  deleteTask,
  getTasks,
  NewTaskSchema,
  UpdatedTaskSchema,
  updateTask,
} from './lib'
import { auth } from './auth'

type AuthVariables = {
  user: {
    id: string;
    name: string;
    email: string;
    image?: string | null;
  };
  session: {
    id: string;
    userId: string;
  };
};

export const app = new Hono<{ Variables: AuthVariables }>()

app.use('*', logger())
app.use('*', cors({
  origin: process.env.CORS_ORIGINS?.split(',').map((s) => s.trim()) ?? [],
  credentials: true,
  allowHeaders: ['Content-Type', 'Authorization', 'Cookie'],
  allowMethods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
}))

// better-auth の sign-in / callback / session 等をマウント
app.on(['POST', 'GET'], '/api/auth/*', (c) => auth.handler(c.req.raw))

// /tasks 以下は session 必須
app.use('/tasks/*', async (c, next) => {
  const session = await auth.api.getSession({ headers: c.req.raw.headers })
  if (!session) {
    return c.body(null, 401)
  }
  c.set('user', session.user)
  c.set('session', session.session)
  await next()
})

const route = app
  .get('/tasks', async c => {
    const userId = c.var.user.id
    const result = await getTasks(userId)

    return result.success
      ? c.json(result.data, 200)
      : c.body(null, result.error.statusCode)
  })
  .patch(
    '/tasks/:taskId',
    zValidator(
      'json',
      UpdatedTaskSchema.omit({ userId: true }),
    ),
    zValidator(
      'param',
      z.object({ taskId: z.coerce.number() }),
    ),
    async c => {
      const userId = c.var.user.id
      const { taskId } = c.req.valid('param')
      const updatedTask = c.req.valid('json')

      if (taskId !== updatedTask.id) {
        return c.body(null, 400)
      }

      const result = await updateTask({ ...updatedTask, userId })

      return result.success
        ? c.json(result.data, 200)
        : c.body(null, result.error.statusCode)
    }
  )
  .post(
    '/tasks',
    zValidator('json', NewTaskSchema),
    async c => {
      const userId = c.var.user.id
      const newTask = c.req.valid('json')

      const result = await addTask(newTask, userId)

      return result.success
        ? c.json(result.data, 200)
        : c.body(null, result.error.statusCode)
    }
  )
  .delete(
    '/tasks/:taskId',
    zValidator('param', z.object({ taskId: z.coerce.number() })),
    async c => {
      const userId = c.var.user.id
      const { taskId } = c.req.valid('param')
      const result = await deleteTask(userId, taskId)
      return result.success
        ? c.body(null, 200)
        : c.body(null, result.error.statusCode)
    }
  )

export type AppType = typeof route
