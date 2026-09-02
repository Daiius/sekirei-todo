# 04. 開発環境

> 🚧 **未記述（骨組みのみ）。** 中身は次のセッションで実装から起こす。
> 現時点の記述は [`../AGENTS.md`](../AGENTS.md) の「開発コマンド」「env ファイル構成」
> 「リモート dev」「dev 用セッション発行」の各節にある。

本章はローカル / リモートの開発環境と、env の配り方を定める。本番は [05](./05-deploy.md)。

## 書くこと

- **compose 構成**: database / server-ts / nextjs の 3 サービス。
  ホストに publish するのは nextjs の 1 本だけで、DB (3306) と server-ts (4000) は compose 網内のみ。
  `pnpm dev` が `docker compose watch` ではなく `up --build --watch` である理由。
- **オリジンの配り方**: `PUBLIC_ORIGIN` から compose の `environment:` が nextjs / server-ts の
  URL 系 env（`BETTER_AUTH_URL` / `TRUSTED_ORIGINS`）へ配る。env ファイル側の同名の値は上書きされる。
- **env ファイル構成**: `.env.database` / `.env.server-ts` / `.env.nextjs` / `.env.remote`。
  すべて gitignore 対象で、clone 直後は手元で作成が必要。**値そのものは書かない**（変数名と役割のみ）。
  ⚠ `docker compose restart` は env_file を再ロードしない。`NEXT_PUBLIC_*` は build 時に焼き込まれる。
- **リモート dev**（`pnpm dev:remote`）: 専用 compose ファイルを持たず `.env.remote` の
  3 変数（`WEB_BIND` / `DEV_ALLOWED_HOST` / `PUBLIC_ORIGIN`）だけで差分を吸収する設計。
  cloudflared は compose 外・設定はダッシュボード側のみ（**姿勢のみ**記述し、実ドメインは書かない）。
- **dev セッション発行**（`pnpm dev:session`）: OAuth を通さずログイン済み状態を作る仕組みと、
  🔒 本番イメージに入らないことを保証する多重防御。Playwright への cookie 注入手順。
  ⚠ `TEST_GITHUB_ID` 未設定時に `/tasks/*` が 401 になる罠（→ [02](./02-auth.md)）。
- **静的チェック**: 各ワークスペースの `tsc --noEmit`。
  ⚠ `honox` は依存更新前から失敗している既知の破損で、判定材料にしない。lint は現状未設定。
