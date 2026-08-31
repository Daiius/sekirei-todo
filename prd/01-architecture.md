# 01. アーキテクチャ

> 🚧 **未記述（骨組みのみ）。** 中身は次のセッションで実装から起こす。
> 現時点の記述は [`../AGENTS.md`](../AGENTS.md) の「技術スタック / 構成」節にある。

本章はアプリ全体の技術構成・ワークスペース分割・パッケージ間の責務・オリジン設計を定める。
認証は [02](./02-auth.md)、データモデルは [03](./03-data-model.md)、開発環境は [04](./04-dev-environment.md)、
デプロイは [05](./05-deploy.md) に委ねる。

## 書くこと

- **単一オリジン構成**: ブラウザが叩くのは公開オリジン 1 つだけで、`/api/*` は Next.js の
  `rewrites()`（`afterFiles`）が `${API_URL}` へ素通しする。API ドメインは「Vercel だけが叩く裏口」。
  → この設計にした理由、cookie が host-only + `SameSite=Lax` で足りる根拠、
  ⚠ Vercel 関数の実行時間・レスポンスサイズ上限が `/api/*` に効くこと、
  ⚠ `app/api/**` を作ると rewrite より優先されること。
- **なぜ better-auth が server-ts 側にあるか**: Vercel から VPS の MySQL に到達できないため。
- **パッケージ分割**（`nextjs` / `server-ts` / `database` / 未使用の `honox`）と各々の責務・依存方向。
  catalog によるバージョン共通化と `minimumReleaseAge` の方針。
- **主要技術の選定理由**（Next.js 16 + Turbopack / Hono / Drizzle 1.0-rc / MySQL 8.4）。
- **gap / 計画中**: `honox` の去就、server-ts のテスト基盤、eslint の復活（→ [`../TASKS.md`](../TASKS.md)）。
