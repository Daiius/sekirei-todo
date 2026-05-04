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

DB と server-ts はコンテナ、Next.js はホストで動かす。

```sh
# 初回 / lockfile 変更時のみ
pnpm install

# 別ターミナルで:
pnpm dev                      # docker compose watch (db + server-ts)

pnpm db:migrate               # スキーマ適用 (.env.database 使用)
pnpm db:seed                  # テストデータ投入 (idempotent)

# Next.js はホストで:
cd nextjs && pnpm dev         # localhost:3000

# 後始末
pnpm stop                     # コンテナ停止
pnpm down                     # コンテナ + ネットワーク削除
docker compose down -v        # mysql-data ボリュームも削除して完全リセット
```

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
- `.env.database` に `TEST_GITHUB_ID` を設定すると `addTestData.ts` がローカル DB にこれを自動でセットアップする

## 本番デプロイ概要

- **Next.js**: GitHub の `main` ブランチを Vercel が自動デプロイ。env は Vercel ダッシュボードで設定
- **server-ts**: ghcr.io にイメージを push して VPS 側で pull。手元から:
  ```sh
  docker build --platform=linux/amd64 --push \
    -t ghcr.io/<owner>/sekirei-todo-server-ts \
    -f server-ts/Dockerfile.prod .
  ```
  macOS ホスト → linux/amd64 ターゲットなので `--platform` 必須
- **DB migration**: 本番 DB に対しては手元から SSH トンネル + 管理者権限ユーザで `drizzle-kit push` を直接呼ぶ。`pnpm db:migrate` は dev 用 env を内部で source するため本番には使わない

## OAuth callback URL

GitHub OAuth App の Authorization callback URL は **server-ts の URL に向ける**:
```
https://<api-domain>:8443/api/auth/callback/github
```

## 関連スクリプト

`package.json` (root):
- `dev` / `stop` / `down` / `logs`: docker compose 操作
- `db:migrate` / `db:seed`: ローカル DB へのスキーマ適用 / シード
