import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { db } from 'database/db';

export const auth = betterAuth({
  appName: 'sekirei-todo',
  database: drizzleAdapter(db, { provider: 'mysql' }),
  trustedOrigins:
    process.env.TRUSTED_ORIGINS?.split(',').map((s) => s.trim()) ?? [],
  socialProviders: {
    github: {
      clientId: process.env.GITHUB_CLIENT_ID!,
      clientSecret: process.env.GITHUB_CLIENT_SECRET!,
      // GitHub OAuth で email スコープを許可していない・primary email を private に
      // しているユーザでもログインできるよう、login をベースに .local 予約サフィックスの
      // プレースホルダ email を合成する。
      mapProfileToUser: (profile) => ({
        email: profile.email ?? `${profile.login}@github.placeholder.local`,
        name: profile.name ?? profile.login,
      }),
    },
  },
  advanced: {
    cookiePrefix: 'sekirei',
    // 本番で Next.js (Vercel) と server-ts (VPS) が同一親ドメインのサブドメインなら
    // COOKIE_DOMAIN にその親ドメイン (例: .example.com) を渡して cookie を親ドメインで発行する。
    // 開発環境ではどちらも localhost なので未設定で OK (port 違いでも cookie は共有される)。
    ...(process.env.COOKIE_DOMAIN
      ? {
          crossSubDomainCookies: {
            enabled: true,
            domain: process.env.COOKIE_DOMAIN,
          },
        }
      : {}),
  },
});
