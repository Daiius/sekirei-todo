'use server'

import { auth } from '../auth';

import type { AppType } from 'server-ts'
import { hc, InferRequestType } from 'hono/client'

const client = hc<AppType>(process.env.API_URL!)

export const getTasks = async () => {
  const session = await auth()
  const userId = session?.user?.id
  if (userId == null) {
    console.error(`error @ getTasks: not authorized!`)
    return []
  }

  const result = await client.users[':userId'].tasks.$get({ param: { userId } }) 
  if (!result.ok) {
    console.error(`error @ getTasks: code=${result.status}`)
    return []
  }

  return await result.json()
}

const updateTaskApi = client.users[':userId'].tasks[':taskId'].$patch
type UpdateTaskArg = Omit<
  InferRequestType<typeof updateTaskApi>['json'],
  'userId'
>

export const updateTask = async (updatedTask: UpdateTaskArg) => {
  const session = await auth()
  const userId = session?.user?.id
  if (userId == null) {
    console.error('error @ updateTask: not authorized')
    return undefined
  }

  const result = await updateTaskApi({ 
    json: { ...updatedTask, userId },
    param: { 
      taskId: updatedTask.id.toString(),
      userId: userId,
    } 
  })

  if (!result.ok) {
    console.error(`error @ updateTask: code=${result.status}`)
    return undefined
  }

  return await result.json()
}

const addTaskApi = client.users[':userId'].tasks.$post
type AddTaskArg = InferRequestType<typeof addTaskApi>['json']

export const addTask = async (newTask: AddTaskArg) => {
  const session = await auth()
  const userId = session?.user?.id
  if (userId == null) {
    console.error('error @ addTask : not authorized')
    return undefined
  }
  const result = await addTaskApi({ 
    json: newTask, 
    param: { userId, }
  })

  if (!result.ok) {
    console.error(`error @ addTask: code=${result.status}`)
    return undefined
  }
  return await result.json()
}

const deleteTaskApi = client.users[':userId'].tasks[':taskId'].$delete
export const deleteTask = async (taskId: number) => {
  const session = await auth()
  const userId = session?.user?.id
  if (userId == null) {
    console.error('error @ deleteTask: not authorized')
    return
  }
  const result = await deleteTaskApi({ param: { userId, taskId: taskId.toString() } })
  if (!result.ok) {
    console.error(`error @ deleteTask: code=${result.status}`)
    return
  }
}
