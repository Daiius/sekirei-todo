import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { db } from 'database/db';

export const auth = betterAuth({
  appName: 'sekirei-todo',
  database: drizzleAdapter(db, { provider: 'mysql' }),
  socialProviders: {
    github: {
      clientId: process.env.GITHUB_CLIENT_ID!,
      clientSecret: process.env.GITHUB_CLIENT_SECRET!,
      // GitHub OAuth で email スコープを許可していない・primary email を private にしている
      // ユーザでもログインできるよう、login をベースにプレースホルダ email を合成する。
      // .local は予約サフィックスで実際のメール送信先にはならない。
      mapProfileToUser: (profile) => ({
        email: profile.email ?? `${profile.login}@github.placeholder.local`,
        name: profile.name ?? profile.login,
      }),
    },
  },
  advanced: {
    cookiePrefix: 'sekirei',
  },
});
