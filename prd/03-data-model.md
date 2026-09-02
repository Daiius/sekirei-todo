# 03. データモデルとマイグレーション

> 🚧 **未記述（骨組みのみ）。** 中身は次のセッションで実装から起こす。
> 現時点の記述は [`../AGENTS.md`](../AGENTS.md) の「DB マイグレーション」節と、
> [`../README.md`](../README.md) の「DB 設計」節にある。

本章は DB スキーマとマイグレーションの方式を定める。
識別子の意味論は [02](./02-auth.md)、適用の運用は [04](./04-dev-environment.md) / [05](./05-deploy.md)。

## 書くこと

- **テーブル**: `Projects` / `Tasks`（アプリ本体）と better-auth の
  `user` / `session` / `account` / `verification`。列・型・制約・関連を**実スキーマから漏らさず**起こす。
  - Users ||--o{ Projects、Users ||--o{ Tasks、Tasks }o--o| Projects の関係
  - 個人運用前提のため、ユーザー間でのタスク/プロジェクト共有は設計に含めない
- **マイグレーション方式**: 生成は `drizzle-kit generate`（dev 専用）、適用は drizzle-orm の `migrate()`。
  `drizzle-kit push` を使わない理由（本番イメージに drizzle-kit を入れずに済み、dev と本番で
  適用経路が 1 本になる）。`__drizzle_migrations` による冪等性。
  ⚠ 生成物（`migration.sql` / `snapshot.json`）を commit し忘れると本番で適用されない。
- **ファイル配置**: `database/drizzle/` / `database/migrate.ts`（⚠ パッケージルート直下でなければ
  `migrationsFolder` の自ファイル相対解決が壊れる）/ `database/seed.ts` / `database/esbuild.config.ts`。
- **シード**: `pnpm db:seed` の冪等性、`TEST_USER_ID` / `TEST_GITHUB_ID` が作るレコード。
- ⚠ **本番 DB のベースライン化**（init が既存 `Projects` / `Tasks` と衝突する問題）。
  姿勢のみ記述し、手順とスクリプトは `.claude/local/` に置く（→ [05](./05-deploy.md)）。
