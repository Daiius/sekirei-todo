'use server'

import { headers as nextHeaders } from 'next/headers';

import type { AppType } from 'server-ts'
import { hc, InferRequestType } from 'hono/client'

const apiUrl = process.env.API_URL ?? process.env.NEXT_PUBLIC_API_URL ?? '';

// 型推論専用の client。実際の HTTP 呼び出しには使わないので URL/fetch は適当。
const typedClient = hc<AppType>(apiUrl);

/**
 * server-ts に対するクライアント。
 * better-auth が server-ts 側にあるため、リクエストごとに browser/Next.js が
 * 受け取ったクッキーをそのまま転送して session を成立させる。
 */
const makeClient = async () => {
  const cookie = (await nextHeaders()).get('cookie') ?? '';
  return hc<AppType>(apiUrl, {
    fetch: async (url: RequestInfo | URL, init?: RequestInit) => {
      const headers = new Headers(init?.headers);
      if (cookie) headers.set('cookie', cookie);
      return await fetch(url, { ...init, headers });
    },
  });
};

export const getTasks = async () => {
  const client = await makeClient();
  const result = await client.tasks.$get();
  if (!result.ok) {
    if (result.status !== 401) {
      console.error(`error @ getTasks: code=${result.status}`);
    }
    return [];
  }
  return await result.json();
}

type UpdateTaskArg = InferRequestType<typeof typedClient.tasks[':taskId']['$patch']>['json'];

export const updateTask = async (updatedTask: UpdateTaskArg) => {
  const client = await makeClient();
  const result = await client.tasks[':taskId'].$patch({
    json: updatedTask,
    param: { taskId: updatedTask.id.toString() },
  });

  if (!result.ok) {
    console.error(`error @ updateTask: code=${result.status} ${result.statusText}`);
    return undefined;
  }

  return await result.json();
}

type AddTaskArg = InferRequestType<typeof typedClient.tasks['$post']>['json'];

export const addTask = async (newTask: AddTaskArg) => {
  const client = await makeClient();
  const result = await client.tasks.$post({ json: newTask });

  if (!result.ok) {
    console.error(`error @ addTask: code=${result.status}`);
    return undefined;
  }
  return await result.json();
}

export const deleteTask = async (taskId: number) => {
  const client = await makeClient();
  const result = await client.tasks[':taskId'].$delete({
    param: { taskId: taskId.toString() },
  });
  if (!result.ok) {
    console.error(`error @ deleteTask: code=${result.status}`);
    return;
  }
}
