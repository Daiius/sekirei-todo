# 02. 認証とセッション

本章は認証方式・セッションの持ち方・ユーザー識別子の意味論を定める。
テーブル定義そのものは [03](./03-data-model.md)、env の配り方は [04](./04-dev-environment.md)、
本番の設定値は [05](./05-deploy.md)。

## 認証方式

**better-auth の GitHub OAuth のみ**である（`server-ts/src/auth.ts`）。
パスワード認証・メールリンク・他プロバイダは持たない。better-auth は
drizzleAdapter で MySQL に直接つなぐため、VPS 上の server-ts に置いている（[01](./01-architecture.md)）。

## 認証フロー

```
[Browser] ──(1) authClient.signIn.social ──► /api/auth/sign-in/social  （同一オリジン）
                                                │ rewrites()
                                                ▼
                                        [server-ts] better-auth
                                                │ (2) 302
                                                ▼
                                            GitHub OAuth
                                                │ (3) callback
                                                ▼
              <frontend-domain>/api/auth/callback/github ──rewrites()──► [server-ts]
                                                │ (4) Set-Cookie + redirect
                                                ▼
                                            /tasks
```

1. ブラウザは自分と同じオリジンの `/api/auth/*` を叩く。`rewrites()` が server-ts へ素通しする。
2. better-auth が GitHub の認可画面へリダイレクトする。
3. **callback URL は公開オリジン（フロント側）に向ける。** API ドメインには向けない
   （ブラウザは API ドメインを踏まないため）。
4. server-ts が cookie を発行し、`callbackURL` へ戻す。

Server Action とサーバ側の `getSession`（`nextjs/src/lib/auth.ts`）は rewrite を通さず
`API_URL` を直接使う。`getSession` は現在のリクエストの cookie を
`${API_URL}/api/auth/get-session` へ転送して session を取り出す
（`cache: 'no-store'`）。タスク CRUD も同様に、Server Action が受け取った cookie を
そのまま server-ts へ転送して session を成立させる（`nextjs/src/actions/tasksActions.ts`）。

### callback URL の登録先

環境ごとに次を登録する。

| 環境 | callback URL |
|---|---|
| ローカル dev | `http://localhost:3000/api/auth/callback/github` |
| リモート dev | `https://<dev-host>/api/auth/callback/github` |
| 本番 | `https://<frontend-domain>/api/auth/callback/github` |

- better-auth は **`BETTER_AUTH_URL` から `redirect_uri` を組み立てる**ので、
  `BETTER_AUTH_URL` は**公開オリジン**でなければならない（API ドメインではない）。
- 🔒 **環境ごとに別の OAuth App を使う。** 1 つの App に複数環境の callback URL を
  相乗りさせない。App の実体と運用手順はリポジトリに置かない（[05](./05-deploy.md)）。

## cookie

`advanced.cookiePrefix: 'sekirei'` を設定しているので、session cookie の名前は
**`sekirei.session_token`** である（https の環境では `__Secure-` prefix が付く）。

- 値は better-call の署名付き形式
  `<token>.<HMAC-SHA256(BETTER_AUTH_SECRET, token) の base64>` を URL エンコードしたものである。
- 属性は **`httpOnly`** / **`SameSite=Lax`** / **host-only**。
- 🔒 **cookie の値そのものは文書にもコードにも書かない。**

**`COOKIE_DOMAIN` / `crossSubDomainCookies` は廃止した。** 単一オリジン構成では cookie が
常に同一オリジンで往復するため、親ドメインへの発行が不要になったからである
（[01](./01-architecture.md)）。同じ理由で `CORS_ORIGINS` も廃止しており、
`server-ts/src/app.ts` は値が空なら cors ミドルウェアを張らない。

### auth-client の baseURL

`nextjs/src/lib/auth-client.ts` は `createAuthClient()` を **baseURL 無指定**で呼ぶ。
better-auth はブラウザでは `window.location.origin` に解決し、そこへ basePath `/api/auth` を
付けるので、単一オリジン構成ではこれが正しい。

- ⚠ **相対パスの baseURL（`'/api/auth'`）を渡してはいけない。** better-auth は baseURL を
  `new URL()` で検証するため、相対パスでは `createAuthClient` の呼び出し時点で例外になる。
- `SignInButton` の `callbackURL` は**相対パス `/tasks`** である。better-auth の originCheck は
  callbackURL に限り安全な相対パスを許可するので、`trustedOrigins` に無くても通る。

## 防御の位置

🔴 **`nextjs/src/proxy.ts` は防御ではない。**

`proxy.ts` は `getSessionCookie()` で **cookie の存在しか見ていない**。署名の検証も
セッションの有効期限の確認もしない。これは**未ログインのユーザを `/` へ、ログイン済みのユーザを
`/tasks` へ送る UX 上のリダイレクト**に過ぎない。

**実際の防御は `server-ts/src/app.ts` の `/tasks/*` 前段ミドルウェアである。**

1. `auth.api.getSession()` で session を検証する。無ければ **401**。
2. `getGitHubAccountId()` で session の `user.id` から GitHub の numeric id を解決する。
   解決できなければ **401**。
3. 解決した id を `c.var.userId` に載せ、以降のハンドラはこれを所有者として使う。

**これは CVE-2025-29927 を踏まえた意図的な設計である。** Next.js の middleware に認証の
脆弱性が問題になった経緯があり、middleware を防御の本体にしない方針を採っている
（[01](./01-architecture.md) §インフラの置き場所とその理由）。middleware が丸ごと迂回されても、
データに触れるのは server-ts の検証を通った要求だけである。

⚠ **副作用**: cookie が残ったままセッションが無効になった状態では、`proxy.ts` は
「ログイン済み」と判断して `/tasks` に留める。一方 API は 401 を返すので、
**空のタスク一覧が表示される**。サインインへ誘導する表示も出ない。
これはエラー表示の gap と同じ根を持つ（[01](./01-architecture.md) §gap / 検討中）。

## ユーザー識別子の意味論

🔴 **`tasks.userId` / `projects.userId` は GitHub の numeric id を保持する。**
better-auth が生成する `user.id`（UUID）とは**別物**である。

旧 next-auth 時代のデータをそのまま引き継ぐための設計で、両者は `account` テーブルを経由して
解決する（`getGitHubAccountId` / `database/db/lib.ts`）。

```
session.user.id (UUID)
   │  account.userId で引く（providerId = 'github'）
   ▼
account.accountId (GitHub numeric id)
   │  そのまま
   ▼
tasks.userId / projects.userId
```

- ⚠ **FK は張っていない。** `account.accountId` は単独では UNIQUE ではなく（unique index は
  `(issuer, accountId)` の複合）、別 provider との混在もあり得るためである。
  所有者の一致はアプリ層（上記ミドルウェア + 各クエリの `where`）で担保する。
- ⚠ **解決できないと `/tasks/*` は 401 になる。** session 自体は有効なのに 401 が返るので
  紛らわしい。dev で `.env.database` の `TEST_GITHUB_ID` を空にしたまま
  `pnpm db:seed` を流すとこの状態になる（[04](./04-dev-environment.md)）。
- 過去のタスクを既存アカウントへ引き継ぎたい場合は、`account` レコードを挿入して
  login 時に既存の `user.id` へマップさせる。ローカルでは `TEST_GITHUB_ID` を設定すると
  `database/seed.ts` が自動でこれを行う。

### プレースホルダ email

`mapProfileToUser` で、GitHub の email スコープを許可していない、または primary email を
private にしているユーザ向けに `<login>@github.placeholder.local` という email を合成している。
`user.email` は NOT NULL かつ UNIQUE なので、email が取れないとユーザ作成に失敗するためである。
`.local` は予約サフィックスなので、実在のアドレスと衝突しない。

## サインインできる人の制限

**あるべき姿は、サインインできるのは本人だけであること**である（[00](./00-product.md)）。
GitHub の numeric id による許可リストで絞る方針を採る。

⚠ **未実装である。** `server-ts/src/auth.ts` には許可リストもサインインを拒否するフックも無く、
**GitHub アカウントを持つ誰でもサインインできる**。データはユーザごとに分離されているので
他人のタスクは見えないが、ユーザレコードは作られる。

## ursa-auth（自前 IdP）への統合

一時は自前の OIDC IdP（ursa-auth）へ統合する案を持っていたが、**取り下げた**。
動機は複数サービスで OAuth App の枠を節約することだったが、**その制約（X OAuth App の
無料枠の制限）が解消したため**である。当面は GitHub OAuth を直接使い続ける。

## 要確認

- **CSRF 対策の見直し。** better-auth の originCheck と `SameSite=Lax` に依存している現状で
  十分かを点検していない。とくに**プレビューデプロイのオリジンを `trustedOrigins` に
  追加すべきか**は**未決定**である。追加すればプレビュー環境で認証を試せるが、
  信頼するオリジンが増える。**要確認。**
