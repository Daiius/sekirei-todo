# Sekirei Todo - 開発者向けガイド

セキレイをモチーフにした個人用 Todo Web アプリ。Next.js (Vercel) + Hono (VPS) + MySQL (VPS) 構成。

## 構成概要

```
[Browser]
   │
   ├── HTTPS ──► [Next.js on Vercel]   (UI / Server Actions)
   │              ・https://<frontend-domain>
   │              ・proxy.ts で未ログインを / にリダイレクト
   │              ・Server Action は cookie を server-ts に転送
   │
   └── HTTPS ──► [server-ts on VPS]    (Hono + better-auth + drizzle)
                  ・https://<api-domain>:8443
                  ・/api/auth/*  → better-auth (GitHub OAuth)
                  ・/tasks/*     → タスク CRUD (session 必須)
                            │
                            ▼
                  [MySQL on VPS]
```

cookie は parent domain (`.<root-domain>`) で発行されており、`<frontend-domain>` と `<api-domain>` のサブドメイン間で共有される。

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
- better-auth 1.6.x
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

この「単一オリジンに畳む」構成のおかげで `COOKIE_DOMAIN` / `crossSubDomainCookies` は
ローカル・リモートとも不要になる。ブラウザから見えるオリジンは compose の `PUBLIC_ORIGIN`
1 つで、そこから `NEXT_PUBLIC_API_URL` / `NEXT_PUBLIC_APP_URL` / `BETTER_AUTH_URL` /
`TRUSTED_ORIGINS` / `CORS_ORIGINS` に配られる (既定 `http://localhost:3000`)。
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
| `.env.server-ts` | BETTER_AUTH_*、GITHUB_CLIENT_*、TRUSTED_ORIGINS、CORS_ORIGINS、COOKIE_DOMAIN | server-ts コンテナ |
| `.env.nextjs` | API_URL、NEXT_PUBLIC_API_URL、NEXT_PUBLIC_APP_URL | Next.js dev / build (`nextjs/.env.local` symlink で参照) |

## env 変更時の注意

- `docker compose restart` は env_file を再ロードしない → `docker compose up -d --force-recreate <service>` を使う
- Next.js の `NEXT_PUBLIC_*` は build 時にバンドルへ焼き込まれる → dev は `next dev` を再起動、prod は redeploy 必要

## 認証ライブラリ移行で残っている注意

- 旧 next-auth 時代は `tasks.userId` に GitHub の数値 ID を直接保存していた
- 現在の better-auth は `user.id` (UUID 形式) を生成し、`account` テーブルで GitHub ID と紐付ける
- 過去のタスクを救出したい場合は `account` レコードを手動で挿入して、login 時に既存 user.id にマップさせる必要がある
- `.env.database` に `TEST_GITHUB_ID` を設定すると `database/seed.ts` がローカル DB にこれを自動でセットアップする

## 本番デプロイ概要

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

GitHub OAuth App の Authorization callback URL は **server-ts の URL に向ける**:
```
https://<api-domain>:8443/api/auth/callback/github
```

## 関連スクリプト

`package.json` (root):
- `dev` / `stop` / `down` / `logs`: docker compose 操作
- `db:generate`: スキーマから SQL を生成 (`database/drizzle/` へ。DB には接続しない)
- `db:migrate` / `db:seed`: 生成済み SQL の適用 / シード投入 (`docker compose exec server-ts` 経由)
