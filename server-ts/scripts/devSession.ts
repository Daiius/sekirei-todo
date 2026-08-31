// dev 用: GitHub OAuth を通さずに「ログイン済み」の session cookie を発行する。
//
//   pnpm dev:session          # = docker compose exec server-ts pnpm session
//
// 出力された COOKIE=... の値を Playwright の addCookies に流し込むと、
// ブラウザ側がログイン済み状態になる（使い方は CLAUDE.md 参照）。
//
// 🔒 本番では絶対に動かさない。Dockerfile.prod は server-ts/src だけを COPY し、
//    esbuild も src/index.ts を入口にバンドルするのでこのファイルは本番像に入らないが、
//    多重防御として NODE_ENV=production を実行時にも弾く。

import { createHmac } from 'node:crypto';

import { auth } from '../src/auth';

if (process.env.NODE_ENV === 'production') {
  console.error('devSession: NODE_ENV=production では実行できません (dev 専用スクリプト)');
  process.exit(1);
}

const userId = process.env.TEST_USER_ID;
if (!userId) {
  console.error(
    'devSession: TEST_USER_ID が未設定です。' +
    '.env.database に TEST_USER_ID を設定し、`pnpm db:seed` で user レコードを作ってください。'
  );
  process.exit(1);
}

// auth.api.* には「既存 user へ無条件に session を発行する」公開 API が無いため、
// $context 経由で internalAdapter を直接叩く。
const ctx = await auth.$context;
const session = await ctx.internalAdapter.createSession(userId);

// cookie 値は better-call の署名付き形式:
//   <token>.<base64(HMAC-SHA256(BETTER_AUTH_SECRET, token))>
// これを URL エンコードしたものが cookie にそのまま載る。
const sig = createHmac('sha256', ctx.secret).update(session.token).digest('base64');
console.log('COOKIE=' + encodeURIComponent(`${session.token}.${sig}`));

// mysql2 の pool が開いたままなので明示的に落とす。
process.exit(0);
