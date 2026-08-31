import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { db } from 'database/db';

export const auth = betterAuth({
  appName: 'sekirei-todo',
  database: drizzleAdapter(db, { provider: 'mysql' }),
  // 公開オリジン (= ブラウザから見える Next.js のオリジン) を 1 つ渡す。単一オリジン化
  // 後も、callbackURL / redirect 先の検証にこの一覧が使われるので引き続き必要。
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
    // COOKIE_DOMAIN / crossSubDomainCookies は廃止した。
    // ブラウザから見えるオリジンは Next.js の 1 つだけで、server-ts へは Next.js の
    // rewrites() 経由 (サーバ間) でしか到達しない = cookie は常に同一オリジンで往復する。
    // よって host-only + SameSite=Lax の既定で足り、親ドメイン発行は不要になった。
    // (dev/remote/本番いずれも同じ。詳細は AGENTS.md「技術スタック / 構成」参照)
  },
});
