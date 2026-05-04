import { headers as nextHeaders } from 'next/headers';

export type Session = {
  user: {
    id: string;
    name: string;
    email: string;
    image?: string | null;
  };
  session: {
    id: string;
    userId: string;
    expiresAt: string;
  };
};

/**
 * server-ts の /api/auth/get-session を呼んで、現在のリクエストのクッキーから
 * session を取得する。better-auth は VPS 側 (server-ts) に置かれているため、
 * Next.js (Vercel) からは HTTP 経由で session を確認する。
 */
export const getSession = async (): Promise<Session | null> => {
  const cookie = (await nextHeaders()).get('cookie') ?? '';
  if (!cookie) return null;

  const apiUrl = process.env.API_URL ?? process.env.NEXT_PUBLIC_API_URL;
  const res = await fetch(`${apiUrl}/api/auth/get-session`, {
    headers: { cookie },
    cache: 'no-store',
  });
  if (!res.ok) return null;
  const body = await res.text();
  if (!body || body === 'null') return null;
  return JSON.parse(body) as Session;
};
