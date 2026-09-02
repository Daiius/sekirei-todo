# Sekirei Todo

身の回りにセキレイがたくさんいるので、それをモチーフにした個人用の Todo アプリです。
GitHub アカウントでログインし、プロジェクト単位でタスクを追加・完了・削除できます。

Next.js の Server Component / Server Action と Hono API を組み合わせた構成そのものが題材でもあり、
「Next.js らしいデータのやり取り」を実際に動くアプリで確かめる場を兼ねています。

## 構成

ブラウザから見えるオリジンは 1 つだけです。`/api/*` は Next.js の `rewrites()` が
API サーバへ素通しするので、ブラウザが API のドメインを直接踏むことはありません。

```
[Browser] ──HTTPS──► [Next.js]  UI / Server Actions
                        │        /api/* → rewrites() で素通し
                        ▼
                     [Hono API]  better-auth (GitHub OAuth) + タスク CRUD
                        │
                        ▼
                     [MySQL]
```

pnpm workspace で分割しています。

| パッケージ | 役割 |
|---|---|
| [`nextjs/`](./nextjs) | Next.js アプリ（UI / Server Actions） |
| [`server-ts/`](./server-ts) | Hono API + better-auth |
| [`database/`](./database) | drizzle スキーマ + DB クライアント + migrate / seed |
| [`honox/`](./honox) | 実験用（現在未使用） |

**主な依存**: Node.js 22 / pnpm 10 / Next.js 16（Turbopack）/ React 19 / TypeScript 6 /
Hono 4 / drizzle-orm / better-auth / MySQL 8.4

## 動かす

3 つのパッケージとも docker compose で動きます。ホストに公開されるポートは Next.js の 1 本だけです。

```sh
pnpm install
pnpm dev          # → http://localhost:3000
pnpm db:migrate   # 生成済み SQL を適用
pnpm db:seed      # テストデータ投入（冪等）
```

⚠ env ファイル（`.env.database` / `.env.server-ts` / `.env.nextjs`）は gitignore 対象なので、
clone 直後は手元で作成が必要です。中身は [AGENTS.md](./AGENTS.md) の「env ファイル構成」を参照してください。

## 文書

- [AGENTS.md](./AGENTS.md) — **リポジトリの正典**。開発コマンド・構成・規約はここに集約しています
- [`prd/`](./prd/) — 仕様（あるべき設計）
- [`docs/`](./docs) — その他の文書（[開発日誌](./docs/journal.md) など）
- 進行中の課題は GitHub Issues

このリポジトリは公開しているため、秘密情報・実ドメイン名・本番環境に関する情報は
コードにも文書にも持ち込みません（→ [AGENTS.md](./AGENTS.md) の「公開リポジトリ方針」）。
