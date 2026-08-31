# Sekirei Todo - 開発者向けガイド

セキレイをモチーフにした個人用 Todo Web アプリ。Next.js (Vercel) + Hono (VPS) + MySQL (VPS) 構成。

## 構成概要

**ブラウザから見えるオリジンは 1 つだけ**（dev / remote / 本番いずれも同じ形）。

```
[Browser]
   │
   └── HTTPS ──► [Next.js on Vercel]   https://<frontend-domain>
                  ・/            → UI / Server Actions
                  ・proxy.ts で未ログインを / にリダイレクト
                  ・/api/*      → next.config.ts の rewrites() が
                                   ${API_URL}/api/* へ素通し（Vercel のサーバ側 fetch）
                            │
                            ▼  ブラウザは踏まない。Vercel からのみ到達する裏口
                  [server-ts on VPS]    https://<api-domain>:8443
                  ・/api/auth/*  → better-auth (GitHub OAuth)
                  ・/tasks/*     → タスク CRUD (session 必須)
                            │
                            ▼
                  [MySQL on VPS]
```

- **認証**（`SignInButton` / `SignOutButton` の `authClient`）はブラウザから走るが、
  叩き先は自分と同じオリジンの `/api/auth/*` で、Vercel の rewrite が VPS へ転送する。
- **タスク CRUD**（`nextjs/src/actions/tasksActions.ts`）と `getSession`
  （`nextjs/src/lib/auth.ts`）は Server Action / サーバ側 fetch なので、
  rewrite を通さず `API_URL` を直接使う。
- API ドメインは**残る**（rewrite の宛先は絶対 URL なので公開 DNS 名と TLS 証明書が要る）。
  役割が「ブラウザ向けの公開エンドポイント」から「Vercel だけが叩く裏口」に変わっただけ。
  ⚠ ユーザー判断により、VPS への直アクセス対策（共有シークレットヘッダ等）は入れていない。

同一オリジンなので cookie は **host-only + `SameSite=Lax`** で足りる。
`COOKIE_DOMAIN` / `crossSubDomainCookies` / `CORS_ORIGINS` は**廃止**した。

### 注意点

- ブラウザ → Vercel → VPS と **1 ホップ増える**。`/api/*` は Vercel の関数を経由するので、
  **関数の実行時間上限とレスポンスサイズ上限**が効く。大きいレスポンスや長時間処理を
  `/api/*` に載せない。
- rewrite は `beforeFiles` ではなく **`afterFiles`**（`rewrites()` が配列を返す形）。
  つまり **Next.js 側に `app/api/**` を作るとそちらが優先され**、rewrite まで届かなくなる。
  Next.js に API Route を足すときは server-ts のパスと衝突しないか確認すること。

## なぜ better-auth は server-ts 側にあるか

Next.js (Vercel) から VPS の MySQL へ直接接続できない。そのため drizzleAdapter を使う better-auth は VPS 上の server-ts に置き、Next.js は HTTP 経由で session を確認する形にしている。詳しくはコミット履歴と過去の議論参照。

## ワークスペース構成 (pnpm workspace + catalog)

| パッケージ | 役割 | デプロイ先 |
|---|---|---|
| `nextjs/` | Next.js アプリ (UI / Server Actions) | Vercel |
| `server-ts/` | Hono API + better-auth | VPS (ghcr.io 経由 Docker image) |
| `database/` | drizzle スキーマ + 共通 DB クライアント | (依存として両方から使用) |
| `honox/` | 実験用 (現在未使用、依存最新化のみ) | - |

`pnpm-workspace.yaml` の catalog で typescript / @types/node / hono / zod / drizzle 系を共通化。

## 技術スタック (主要バージョン)

- Node.js 22 (production container `gcr.io/distroless/nodejs22-debian12`)
- pnpm 10.33.2 (corepack)
- Next.js 16.2.x (Turbopack, cacheComponents=true)
- React 19.2.x
- TypeScript 6.x
- Hono 4.12.x + @hono/node-server v2
- drizzle-orm / drizzle-kit 1.0-rc.1
- better-auth 1.7.x
- MySQL 8.4

## 開発ワークフロー

database / server-ts / nextjs の 3 つとも compose で動かす。

```sh
# 初回 / lockfile 変更時のみ
pnpm install

pnpm dev                      # docker compose up --build --watch (database + server-ts + nextjs)
                              # → http://localhost:3000

pnpm db:migrate               # 生成済み SQL を適用 (稼働中の server-ts コンテナ内で実行)
pnpm db:seed                  # テストデータ投入 (idempotent)

# 後始末
pnpm stop                     # コンテナ停止
pnpm down                     # コンテナ + ネットワーク削除
docker compose down -v        # mysql-data ボリュームも削除して完全リセット
```

`pnpm dev` は `docker compose watch` ではなく `docker compose up --build --watch` を使う。
`watch` 単体だとコンテナが起動しないことがあったため。

### ホストに公開するポートは nextjs の 1 本だけ

```
[browser] ─▶ ${WEB_BIND:-3000} ─▶ nextjs ─▶ server-ts:4000 ─▶ database:3306
                                    /api/* を rewrite      (どちらも compose 網内のみ)
```

database (3306) と server-ts (4000) はホストに publish しない。到達経路は次のとおり:

- ブラウザ → server-ts: `next.config.ts` の `rewrites()` が `/api/:path*` を `${API_URL}`
  (compose では `http://server-ts:4000`) へ素通しする。better-auth は `/api/auth/*` を
  その path のまま受けるので書き換えない。
- Next.js (Server Action / `getSession`) → server-ts: compose 網内で `server-ts:4000` に直接。
- DB に直接つなぐ: `docker compose exec database mysql -u"$MYSQL_USER" -p"$MYSQL_PASSWORD" "$MYSQL_DATABASE"`
  (環境変数はコンテナ内に入っているのでそのまま参照できる)

この「単一オリジンに畳む」構成のおかげで `COOKIE_DOMAIN` / `crossSubDomainCookies` /
`CORS_ORIGINS` はローカル・リモート・本番とも不要になった。
ブラウザから見えるオリジンは compose の `PUBLIC_ORIGIN` 1 つで、そこから server-ts の
`BETTER_AUTH_URL` / `TRUSTED_ORIGINS` に配られる (既定 `http://localhost:3000`)。

ブラウザ側に公開オリジンを焼き込む必要はもう無いので、`NEXT_PUBLIC_API_URL` /
`NEXT_PUBLIC_APP_URL` は compose から渡していない:

- `nextjs/src/lib/auth-client.ts` は `createAuthClient()` を **baseURL 無指定**で呼ぶ。
  better-auth はブラウザで `window.location.origin + /api/auth` に解決する。
  ⚠ 相対パスの baseURL (`'/api/auth'`) は `new URL()` 検証に落ちて例外になるので渡さない。
- `SignInButton` の `callbackURL` は **相対パス `/tasks`**。better-auth の
  originCheck は callbackURL に限り相対パスを許可する。

`.env.nextjs` / `.env.server-ts` に古い `localhost:4000` 系の値が残っていても compose の
`environment:` が勝つ。**GitHub OAuth App の Authorization callback URL に
`http://localhost:3000/api/auth/callback/github` を登録しておくこと。**

## リモート dev 環境 (pnpm dev:remote)

常駐マシン上の dev スタックを Cloudflare Tunnel + Access 越しに手元ブラウザから使う構成。
**リモート専用の compose ファイルは持たない。** 差分は `.env.remote` の環境変数だけに集約する。

```sh
cp .env.remote.example .env.remote   # 値を埋める (.env.remote は gitignore 対象)
pnpm dev:remote          # 起動 (foreground・--build --watch)
pnpm dev:remote:logs     # 別ターミナルでログ追尾 (任意)
pnpm dev:remote:down     # 停止 (mysql-data volume は残す)
```

ローカルとの差は 3 変数のみ:

| 変数 | ローカル既定 | remote | 効かせ方 |
|---|---|---|---|
| `WEB_BIND` | `3000` (全 IF) | `127.0.0.1:8701` | compose の `ports: '${WEB_BIND:-3000}:3000'` |
| `DEV_ALLOWED_HOST` | `localhost` | `<dev-host>` | `next.config.ts` が `allowedDevOrigins` を条件付与 |
| `PUBLIC_ORIGIN` | `http://localhost:3000` | `https://<dev-host>` | compose が nextjs / server-ts の URL 系 env に配る |

Next.js の HMR は同一オリジンの WebSocket なので、トンネルが wss を通せば追加設定は不要。

### cloudflared 側 (リポジトリには持たない)

**cloudflared は compose 外**で動かす (systemd 常駐・token 起動)。ingress ルールと
Cloudflare Access のポリシーは **Cloudflare Zero Trust ダッシュボード側だけで管理し、
リポジトリにもホストにも設定ファイルを置かない。** 実ドメイン名もリポジトリには書かない
(このドキュメントでは `<dev-host>` と表記する)。

ダッシュボードで設定すること:

- Tunnel の public hostname `<dev-host>` の ingress 向き先を **`http://127.0.0.1:8701`** にする
  (= `.env.remote` の `WEB_BIND` のポート)。
- Access のポリシーで許可メールを限定する。
- GitHub OAuth App の Authorization callback URL に
  `https://<dev-host>/api/auth/callback/github` を追加する (callback URL は複数登録できるので、
  ローカル用・本番用と併存させる)。

## dev 用セッション発行スクリプト (GitHub OAuth を通さずログイン済みにする)

E2E や手動確認で「ログイン済み `/tasks`」を作りたいとき、GitHub OAuth を毎回通す必要はない。
`server-ts/scripts/devSession.ts` が既存 user に対して session を直接発行し、
ブラウザに入れるべき cookie 値を出力する。

```sh
pnpm dev:session
# → COOKIE=<token>.<署名> (URL エンコード済み)
```

- 実体は `docker compose exec server-ts pnpm --filter server-ts session`。**`pnpm dev` が
  上がっている必要がある。**
- 対象ユーザは `.env.database` の `TEST_USER_ID`。未設定ならエラーで停止する。
  先に `pnpm db:seed` で user レコードを作っておくこと。
- 🔒 **本番には入らない。** `Dockerfile.prod` は `server-ts/src` だけを COPY し、esbuild も
  `src/index.ts` を入口にバンドルするのでこのファイルは本番イメージに含まれない。
  `.dockerignore` にも `server-ts/scripts` を入れてあり、スクリプト自身も
  `NODE_ENV=production` なら即 exit 1 する（多重防御）。

### 仕組み

- cookie 名は `advanced.cookiePrefix: 'sekirei'` により **`sekirei.session_token`**。
  dev は http なので `__Secure-` prefix は付かない。
- cookie 値は better-call の署名付き形式
  `<token>.<HMAC-SHA256(BETTER_AUTH_SECRET, token) の base64>` を URL エンコードしたもの。
- server-ts 側の `getSession` は署名検証と DB 照合しか見ない（`ipAddress` / `userAgent` は不問）。
- `auth.api.*` に「既存 user へ無条件に session を発行する」公開 API が無いため、
  `auth.$context` 経由で `internalAdapter.createSession` を使っている。

### Playwright への注入

セッション cookie は **`httpOnly`** なので `document.cookie` では設定できない。
`page.context().addCookies()` を使う。

```js
async (page) => {
  await page.context().addCookies([{
    name: 'sekirei.session_token',
    value: '<pnpm dev:session の出力（COOKIE= の右側をそのまま）>',
    domain: 'localhost', path: '/', httpOnly: true, secure: false, sameSite: 'Lax',
  }]);
  await page.goto('http://localhost:3000/tasks');
}
```

⚠ **`.env.database` の `TEST_GITHUB_ID` が空だと `/tasks/*` が 401 になる。**
`tasks.userId` は GitHub の numeric id を保持する設計で、`getGitHubAccountId`
(`database/db/lib.ts`) が `account` から解決できないと `undefined` を返し、
`server-ts/src/app.ts` の `/tasks/*` ミドルウェアが 401 を返すため。session 自体は
有効なのに 401 になるので紛らわしい。`TEST_GITHUB_ID` を設定してから `pnpm db:seed` すること。

## DB マイグレーション

**生成は `drizzle-kit generate`（dev 専用）、適用は drizzle-orm の `migrate()`。**
`drizzle-kit push` は使わない（本番イメージに drizzle-kit を入れずに済み、dev と本番で
適用経路が 1 本になる ＝ 本番で初めて走る経路が無い）。

| ファイル | 役割 |
|---|---|
| `database/drizzle/<timestamp>_<name>/migration.sql` | 生成済み SQL。**リポジトリにコミットする** |
| `database/migrate.ts` | 適用エントリ。⚠ **パッケージルート直下**（`migrationsFolder` を自ファイルからの相対 URL で解くため） |
| `database/seed.ts` | シード投入エントリ（冪等） |
| `database/esbuild.config.ts` | 上記 2 つを `dist/migrate.js` / `dist/seed.js` へバンドル |

適用済みかどうかは drizzle 標準の `__drizzle_migrations` テーブルが持つので、何度流しても冪等。

### スキーマを変えたときのワークフロー

```sh
# 1. database/db/*.ts を編集
# 2. SQL を生成 (DB には接続しない)
pnpm db:generate                       # = pnpm --filter database generate
# 3. database/drizzle/<timestamp>_<name>/ の migration.sql と snapshot.json を目視して commit
# 4. 適用
pnpm db:migrate
```

⚠ **生成物を commit し忘れると本番で適用されない。** ここが `push` 時代との一番大きな違い。

### dev での適用

`pnpm db:migrate` / `pnpm db:seed` は稼働中の `server-ts` コンテナに `docker compose exec` して
`database` ワークスペースのスクリプトを叩く（dev イメージはソース一式と tsx を持つ）。
DB 接続情報は compose の `env_file: .env.database` で既にコンテナ内にあるので、
ホスト側で env を source する必要はない。`pnpm dev` を先に上げておくこと
（未起動なら `docker compose exec` がそのまま失敗する）。

### 本番での適用

migrate / seed は **server-ts と同じイメージに同梱**してある（適用する SQL とコードの
バージョンが構造的に一致する）。使い捨てコンテナとして明示的に実行する
——**起動時の自動適用はしない**（失敗時の挙動と、インスタンスを増やしたときの競合が読めなくなるため）。

```sh
# VPS 側、本番の compose がある場所で
docker compose run --rm --no-deps <server サービス> migrate.js
```

⚠ 本番イメージは distroless（`ENTRYPOINT` が暗黙に `node`）なので、**渡すのはパスだけ**。
`node /app/migrate.js` と書くと node に node を渡すことになり動かない。

## env ファイル構成 (gitignored)

サービス単位で分割。リポジトリには無いので clone 直後は手元で作成が必要。

| ファイル | 内容 | 主な利用元 |
|---|---|---|
| `.env.database` | MYSQL_*、DB_HOST、TEST_USER_ID、TEST_GITHUB_ID | database コンテナ / pnpm db:migrate / pnpm db:seed |
| `.env.server-ts` | BETTER_AUTH_SECRET、GITHUB_CLIENT_* | server-ts コンテナ |
| `.env.nextjs` | API_URL、NEXT_PUBLIC_APP_URL | Next.js dev / build (`nextjs/.env.local` symlink で参照) |

⚠ `COOKIE_DOMAIN` / `CORS_ORIGINS` は**もう読まれない**（単一オリジン化で廃止）。
`.env.server-ts` に残っていても無害だが、消しておくと混乱がない。
`BETTER_AUTH_URL` / `TRUSTED_ORIGINS` / `CORS_ORIGINS` は dev では compose の
`environment:` が `PUBLIC_ORIGIN` から配るので、env ファイル側の値は上書きされる。

## env 変更時の注意

- `docker compose restart` は env_file を再ロードしない → `docker compose up -d --force-recreate <service>` を使う
- Next.js の `NEXT_PUBLIC_*` は build 時にバンドルへ焼き込まれる → dev は `next dev` を再起動、prod は redeploy 必要

## 認証ライブラリ移行で残っている注意

- 旧 next-auth 時代は `tasks.userId` に GitHub の数値 ID を直接保存していた
- 現在の better-auth は `user.id` (UUID 形式) を生成し、`account` テーブルで GitHub ID と紐付ける
- 過去のタスクを救出したい場合は `account` レコードを手動で挿入して、login 時に既存 user.id にマップさせる必要がある
- `.env.database` に `TEST_GITHUB_ID` を設定すると `database/seed.ts` がローカル DB にこれを自動でセットアップする

## 本番デプロイ概要

本番も dev と同じ**単一オリジン**構成。ブラウザは `https://<frontend-domain>` しか叩かず、
`/api/*` は Vercel の rewrite を経由して VPS の server-ts に届く。

### Vercel (Next.js) に設定する env

| 変数 | 値 | 用途 |
|---|---|---|
| `API_URL` | `https://<api-domain>:8443` | **rewrite の宛先**（`next.config.ts`）兼 Server Action / `getSession` の呼び先。絶対 URL 必須 |
| `NEXT_PUBLIC_APP_URL` | （不要） | 単一オリジン化で参照コードが無くなった。残っていても害は無いが消してよい |
| `NEXT_PUBLIC_API_URL` | （不要） | 同上。`next.config.ts` では `API_URL` 未設定時のフォールバックとしてのみ残っている |

⚠ `NEXT_PUBLIC_*` は build 時にバンドルへ焼き込まれるので、変更したら redeploy が要る。
`API_URL` はサーバ側でしか読まれないが、`rewrites()` は **build 時**に評価されるため
やはり redeploy が必要。

### VPS (server-ts) に設定する env

| 変数 | 値 | 補足 |
|---|---|---|
| `BETTER_AUTH_URL` | `https://<frontend-domain>` | ⚠ **公開オリジン**。API ドメインではない。better-auth はここから OAuth の `redirect_uri` を組み立てる |
| `TRUSTED_ORIGINS` | `https://<frontend-domain>` | 公開オリジン 1 つ |
| `BETTER_AUTH_SECRET` | （秘密） | cookie 署名鍵 |
| `GITHUB_CLIENT_ID` / `GITHUB_CLIENT_SECRET` | （秘密） | GitHub OAuth App |
| `CORS_ORIGINS` | （不要・空） | 同一オリジンなのでプリフライトが起きない。空なら `app.ts` は cors ミドルウェアを張らない |
| `COOKIE_DOMAIN` | **廃止** | もうコードから参照していない。cookie は host-only + `SameSite=Lax` |

API ドメイン (`https://<api-domain>:8443`) は**残す**。rewrite の宛先が絶対 URL なので
公開 DNS 名と TLS 証明書が要る。ブラウザからは踏まれず、Vercel からのみ到達する。
⚠ ユーザー判断により、VPS への直アクセスを塞ぐ共有シークレットヘッダ等は**入れていない**。

### デプロイ手順

- **Next.js**: GitHub の `main` ブランチを Vercel が自動デプロイ。env は Vercel ダッシュボードで設定
- **server-ts**: ghcr.io にイメージを push して VPS 側で pull。手元から:
  ```sh
  docker build --platform=linux/amd64 --push \
    -t ghcr.io/<owner>/sekirei-todo-server-ts \
    -f server-ts/Dockerfile.prod .
  ```
  macOS ホスト → linux/amd64 ターゲットなので `--platform` 必須
- **DB migration**: イメージに同梱した `migrate.js` を VPS 側で使い捨てコンテナとして実行する。手元から SSH トンネルを掘って `drizzle-kit push` を叩く運用は廃止:
  ```sh
  docker compose run --rm --no-deps <server サービス> migrate.js
  ```
  適用する SQL は `docker build` した時点のイメージに焼き込まれているので、**先に `pnpm db:generate` の生成物を commit し、その commit からビルドしたイメージを push しておくこと**

## OAuth callback URL

単一オリジン化により、callback URL は **公開オリジン（Next.js 側）に向ける**。
API ドメインには**向けない**（ブラウザは API ドメインを踏まないため）。

```
https://<frontend-domain>/api/auth/callback/github      # 本番
https://<dev-host>/api/auth/callback/github             # リモート dev
http://localhost:3000/api/auth/callback/github          # ローカル dev
```

callback URL は複数登録できるので、上記を併存させてよい。
better-auth は `BETTER_AUTH_URL` から `redirect_uri` を組み立てるので、
**`BETTER_AUTH_URL` は公開オリジン**でなければならない（API ドメインではない）。

## 関連スクリプト

`package.json` (root):
- `dev` / `stop` / `down` / `logs`: docker compose 操作
- `db:generate`: スキーマから SQL を生成 (`database/drizzle/` へ。DB には接続しない)
- `db:migrate` / `db:seed`: 生成済み SQL の適用 / シード投入 (`docker compose exec server-ts` 経由)
- `dev:session`: dev 用の session cookie 発行 (`server-ts/scripts/devSession.ts`)
