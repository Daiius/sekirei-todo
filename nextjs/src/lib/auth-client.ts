import { createAuthClient } from 'better-auth/react';

// 単一オリジン構成なので baseURL は渡さない。
//
// better-auth 1.7 の getBaseURL (better-auth/dist/utils/url.mjs) は
//   1. baseURL 引数が truthy ならそれを使う (assertHasProtocol → `new URL()` で検証)
//   2. env (BETTER_AUTH_URL / NEXT_PUBLIC_BETTER_AUTH_URL / BASE_URL 等)
//   3. ブラウザなら window.location.origin
// の順に解決し、最後に basePath (既定 `/api/auth`) を付ける。
//
// ⚠ 相対パス (`/api/auth`) を baseURL に渡すと 1. の `new URL()` が失敗し、
//    createAuthClient の呼び出し時点で BetterAuthError を投げる。
//    なので「渡さない」= 3. に落として window.location.origin + /api/auth にする。
//
// SSR 中は window が無いので better-auth 内部のフォールバック文字列 `/api/auth` が
// 使われるが、authClient を呼ぶのは 'use client' の onClick だけなので実害はない
// (サーバ側の session 取得は nextjs/src/lib/auth.ts が API_URL で直接叩く)。
export const authClient = createAuthClient();
