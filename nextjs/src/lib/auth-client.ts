import { createAuthClient } from 'better-auth/react';

// 本番では Vercel と VPS で別ホストなので server-ts の URL を baseURL に渡す。
// NEXT_PUBLIC_API_URL は API のベース URL (パスプレフィックスを含む形, 例:
// `https://example.com/myapp`)。
// nginx 等でパスプレフィックスがある場合 better-auth の withPath は自動で
// /api/auth を補完しないため、ここで明示的に付与する。
export const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_API_URL
    ? `${process.env.NEXT_PUBLIC_API_URL}/api/auth`
    : undefined,
});
