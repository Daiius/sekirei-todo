# PRD: Sekirei Todo

> **この PRD は「実装予定の仕様（あるべき設計）」を書く正典である。** 現在の実装と乖離していても、
> それは**実装がまだ追いついていない gap** であり、PRD の誤りではない
> （理想を本文に書き、現状との差は「gap」「計画中」と明示する）。
> 読み手・レビューは、PRD が現行コードより先行している箇所を**欠陥ではなく実装 TODO** として扱うこと。
>
> **ただし次は現状に忠実であること**（ここが食い違えば PRD の誤り）: ①各章の**「実装済み」記述**は
> 現状を正確に表す、②**既存の DB 列・API・環境変数名**はスキーマに漏らさず載せる、
> ③**設計の意味論**（`tasks.userId` が GitHub numeric id である等）は実データと一致させる。
> 未確定の論点は「要確認」と明記する。
>
> 🔒 **この PRD に GitHub Issue 番号は書かない。** Issue の番号と開閉状況はリポジトリとは独立に
> 変わる一時的な情報である。未実装の項目は「未実装」「計画中」「検討中」という**状態だけ**を書き、
> 個別の課題は GitHub Issues 側で追う。

## 目的

セキレイをモチーフにした**個人用**の Todo Web アプリである。GitHub アカウントでログインし、
自分のタスクを管理する。

同時に、Next.js の Server Component / Server Action と Hono API を組み合わせた構成そのものが
題材でもあり、「Next.js らしいデータのやり取り」を実際に動くアプリで確かめる場を兼ねる。

**目的・利用者の範囲・非目標は [00-product.md](./00-product.md) に集約している。**
共有やコラボレーション、通知、モバイルアプリ化を非目標とすることも、オフライン対応が
非目標ではなく長期の検討事項であることも、同章に書いてある。

## スコープ

**機能の実装状況（実装済み / 未実装 / 要確認 / 検討中）は
[00-product.md](./00-product.md) §機能の実装状況にまとめている。** 各項目からは該当章へリンクしている。

進行中の課題は GitHub Issues を参照すること。

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

本リポジトリは**公開**である。**隠す対象は文書である。**

- 🔒 **秘密情報は文書にもコードにも一切書かない。** `.env*` の値・`BETTER_AUTH_SECRET`・
  DB 資格情報・session cookie の値・OAuth client secret。`.env*` は**読まない・コミットしない**。
- 🔒 **API ドメイン・VPS の接続先・本番/開発の具体情報は書かない。** TLS・リバースプロキシ・
  トンネルの設定・運用スクリプト・VPS の事業者名やスペックは、**姿勢のみ**を記述する。
  実値・実手順は gitignore 対象のローカルメモに置き、「存在すれば参照する」形にする。
- 🔒 **PRD 本文には実ドメイン名を書かない。** `<frontend-domain>` / `<api-domain>` /
  `<dev-host>` / `<root-domain>` / `<owner>` のプレースホルダを用いる。
- ⚠ **コード中に現れる公開フロントエンドの URL は許容する。** OG image の URL は絶対でなければ
  ならず（クローラが相対 URL を解決できない）、`nextjs/src/app/layout.tsx` の metadata に
  実ドメインが入っている。これは既に公開されている情報であり、隠しても実益がない。
  **緩むのは公開フロントエンドの URL だけである。** API ドメイン・接続先・資格情報・env の値を
  隠す線は一切変わらない。
- 🔒 **一時的な情報は書かない。** 「いま何件壊れている」「次に何をする」といった、時間とともに
  変わる情報と、GitHub Issue の番号は書かない（→ 冒頭の注記）。

## 文書索引

| 文書 | 内容 |
|---|---|
| [00-product.md](./00-product.md) | 目的 / 利用者の範囲 / 非目標 / 画面と操作 / 機能の実装状況 |
| [01-architecture.md](./01-architecture.md) | 単一オリジン構成 / インフラの置き場所とその理由 / ワークスペース分割 / gap |
| [02-auth.md](./02-auth.md) | better-auth / GitHub OAuth / session と cookie / 防御の位置 / `tasks.userId` の意味論 |
| [03-data-model.md](./03-data-model.md) | DB スキーマとマイグレーション方式 / drizzle のバージョン指定 |
| [04-dev-environment.md](./04-dev-environment.md) | ローカル dev / リモート dev / dev セッション / env 構成 / 静的チェック |
| [05-deploy.md](./05-deploy.md) | Vercel / VPS / ghcr.io / 本番マイグレーション（姿勢のみ） |
