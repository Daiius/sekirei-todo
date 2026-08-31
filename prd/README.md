# PRD: Sekirei Todo

> 🚧 **この PRD は現在骨組みのみである。** 各章は「何を書く場所か」だけが書かれた雛形で、
> 中身は次のセッション以降に**実装から起こし直して**書く。現時点で内容が揃っているのは
> [`../AGENTS.md`](../AGENTS.md) 側なので、まずはそちらを読むこと。

> **この PRD は「実装予定の仕様（あるべき設計）」を書く正典である。** 現在の実装と乖離していても、
> それは**実装がまだ追いついていない gap** であり、PRD の誤りではない
> （理想を本文に書き、現状との差は「gap」「計画中」と明示する）。
> 読み手・レビューは、PRD が現行コードより先行している箇所を**欠陥ではなく実装 TODO** として扱うこと。
>
> **ただし次は現状に忠実であること**（ここが食い違えば PRD の誤り）: ①各章の**「実装済み」記述**は
> 現状を正確に表す、②**既存の DB 列・API・環境変数名**はスキーマに漏らさず載せる、
> ③**設計の意味論**（`tasks.userId` が GitHub numeric id である等）は実データと一致させる。
> 未確定の論点は「要確認」と明記する。

## 目的

セキレイをモチーフにした**個人用**の Todo Web アプリ。GitHub アカウントでログインし、
プロジェクト単位でタスクを追加・完了・削除できる。個人運用のため、マルチユーザーでの
共有・コラボレーションは想定しない。

Next.js の Server Component / Server Action と Hono API を組み合わせた構成そのものが
題材でもあり、「Next.js らしいデータのやり取り」を実際に動くアプリで確かめる場を兼ねる。

<!-- TODO: 動機・非目標（オフライン対応やアイコンのアニメーションなど README.md の初期構想）を整理して書く -->

## スコープ

<!-- TODO: 「実装済み」「無効化」「計画中」に分けて列挙する。各項目から該当章へリンクする。
     実装済みの候補: GitHub OAuth ログイン / タスク CRUD / プロジェクト分類 / 単一オリジン構成 /
     dev セッション発行 / 生成済み SQL 方式のマイグレーション。
     計画中の候補: ursa-auth (自前 IdP) への統合、eslint 復活、server-ts のテスト（→ ../TASKS.md）。 -->

## アーキ概観

**ブラウザから見えるオリジンは 1 つだけ**（ローカル dev / リモート dev / 本番いずれも同じ形）。

```
[Browser] ──HTTPS──► [Next.js on Vercel]  https://<frontend-domain>
                       ・/ → UI / Server Actions
                       ・/api/* → rewrites() が ${API_URL} へ素通し
                             │  （ブラウザは踏まない裏口）
                             ▼
                     [server-ts on VPS]  Hono + better-auth
                             │
                             ▼
                     [MySQL on VPS]
```

pnpm workspace で `nextjs/` `server-ts/` `database/`（+ 未使用の `honox/`）に分割している。
詳細は [01-architecture.md](./01-architecture.md)。

## 公開リポジトリでの秘匿方針

本リポジトリは**公開**であるため、PRD にも以下を持ち込まない:

- **秘密情報**（`.env*`・`BETTER_AUTH_SECRET`・DB 資格情報・session cookie の値・OAuth client secret）。
- **実ドメイン名**。`<frontend-domain>` / `<api-domain>` / `<dev-host>` / `<root-domain>` /
  `<owner>` のプレースホルダを用いる。
- 本番/開発の具体情報（TLS・接続先・リバースプロキシ・Cloudflare Tunnel の設定）は**姿勢のみ**記述する。
  実値・実手順・運用スクリプトは gitignore 対象の **`.claude/local/`** に置き「存在すれば参照」する。

## 文書索引

1. [01-architecture.md](./01-architecture.md) — 単一オリジン構成 / ワークスペース分割 / パッケージ間の責務
2. [02-auth.md](./02-auth.md) — better-auth / GitHub OAuth / session と cookie / `tasks.userId` の意味論
3. [03-data-model.md](./03-data-model.md) — DB スキーマとマイグレーション方式
4. [04-dev-environment.md](./04-dev-environment.md) — ローカル dev / リモート dev / dev セッション / env 構成
5. [05-deploy.md](./05-deploy.md) — Vercel / VPS / ghcr.io / 本番マイグレーション（姿勢のみ）
