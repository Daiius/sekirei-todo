import { createAuthClient } from 'better-auth/react';

// 本番では Vercel と VPS で別ホストなので server-ts の URL を baseURL に渡す。
// dev では http://localhost:4000、prod では公開 API ドメイン。
export const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
});
