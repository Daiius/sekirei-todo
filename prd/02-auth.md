# 02. 認証とセッション

> 🚧 **未記述（骨組みのみ）。** 中身は次のセッションで実装から起こす。
> 現時点の記述は [`../AGENTS.md`](../AGENTS.md) の「認証（better-auth / GitHub OAuth）」節にある。

本章は認証方式・セッションの持ち方・ユーザー識別子の意味論を定める。
テーブル定義そのものは [03](./03-data-model.md)、env の配り方は [04](./04-dev-environment.md)、
本番の設定値は [05](./05-deploy.md)。

## 書くこと

- **認証フロー**: ブラウザ → 同一オリジンの `/api/auth/*` → rewrite → server-ts の better-auth →
  GitHub OAuth → callback。Server Action / `getSession` は rewrite を通さず `API_URL` を直接使う。
- **cookie**: `advanced.cookiePrefix: 'sekirei'` により `sekirei.session_token`。
  署名形式（better-call の `<token>.<HMAC-SHA256>`）、`httpOnly` / `SameSite=Lax` / host-only。
  `COOKIE_DOMAIN` / `crossSubDomainCookies` を廃止した経緯。
- 🔴 **`tasks.userId` は GitHub の numeric id を保持する**（旧 next-auth 時代からの設計）。
  better-auth の `user.id`（UUID）とは別物で、`account` テーブル経由で解決する
  （`getGitHubAccountId` / `database/db/lib.ts`）。解決できないと `/tasks/*` が 401 になる。
  → この意味論は**実データと一致させること**。
- **OAuth callback URL は公開オリジンに向ける**（API ドメインではない）。
  `BETTER_AUTH_URL` が `redirect_uri` の組み立て元であること。
- **auth-client の baseURL 無指定**と、相対 baseURL が `new URL()` 検証で例外になる件。
- **要確認**: CSRF 対策と Vercel preview deployment の trustedOrigins 扱い（#63）。
