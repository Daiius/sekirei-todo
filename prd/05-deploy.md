# 05. デプロイと本番運用

本章は本番構成とデプロイ経路を定める。🔒 **姿勢のみを書き、実ドメイン・接続先・資格情報・
env の値・運用スクリプトは書かない**（→ [README.md](./README.md) §公開リポジトリでの秘匿方針）。
実値と実手順はリポジトリの外（gitignore 対象のローカルメモ）に置く。

## 本番構成

**本番も dev と同じ単一オリジン構成である**（[01](./01-architecture.md)）。
環境ごとに形を変えないことを方針とする。

| 要素 | 置き場所 |
|---|---|
| Next.js（UI / Server Actions） | Vercel |
| server-ts（Hono + better-auth） | VPS 上の container（ghcr.io 経由で配布） |
| MySQL | VPS |

ブラウザが踏むのは公開オリジン 1 つだけで、`/api/*` は `rewrites()` が API ドメインへ素通しする。
API ドメインは公開 DNS 名と TLS 証明書を持つが、役割は「フロント側だけが叩く裏口」である。

⚠ **裏口への直アクセス対策（共有シークレットヘッダ等）は入れていない。**
ユーザー判断による意図的な選択である。session を持たない要求は server-ts の
`/tasks/*` ミドルウェアが 401 で弾くので、認証の防御自体は成立している（[02](./02-auth.md)）。

## 環境変数

🔒 **値は書かない。変数名と役割だけを書く。**

### フロント側（Vercel）

| 変数 | 役割 |
|---|---|
| `API_URL` | `rewrites()` の宛先であり、Server Action / `getSession` のサーバ側 fetch 先でもある。**絶対 URL 必須** |

- **`NEXT_PUBLIC_*` は 1 つも要らない。** 単一オリジン化により auth-client が baseURL 無指定
  （= `window.location.origin`）になり、`signIn` の `callbackURL` も相対パスになったため、
  ブラウザ側に公開オリジンを焼き込む必要が消えた（[02](./02-auth.md)）。
- ⚠ **`rewrites()` は build 時に評価される。** `API_URL` を変えたら **redeploy が要る**
  （環境変数を差し替えるだけでは反映されない）。

### API 側（VPS）

| 変数 | 役割 |
|---|---|
| `BETTER_AUTH_URL` | better-auth が `redirect_uri` を組み立てる元。⚠ **公開オリジン**（API ドメインではない） |
| `TRUSTED_ORIGINS` | callbackURL / redirect 先の検証に使う信頼オリジンの一覧 |
| `BETTER_AUTH_SECRET` | 🔒 秘密。session cookie の署名鍵 |
| `GITHUB_CLIENT_ID` / `GITHUB_CLIENT_SECRET` | 🔒 秘密。GitHub OAuth App の資格情報 |
| `MYSQL_*` / `DB_HOST` | 🔒 秘密を含む。DB 接続情報 |

**廃止済み**: `COOKIE_DOMAIN` / `CORS_ORIGINS`（および `crossSubDomainCookies` 設定）。
単一オリジン化で不要になった（[01](./01-architecture.md)）。残っていても compose の
`environment:` が空で上書きするが、混乱の元なので消してよい。

## デプロイ経路

- **Next.js**: `main` への push で自動デプロイされる。
- **server-ts**: image を ghcr.io へ push し、VPS 側で pull して差し替える。
  ⚠ **arm64 のホスト（macOS 等）からビルドする場合は `--platform=linux/amd64` を明示する。**
  忘れると VPS で起動しない image が上がる。
- 本番 image は `gcr.io/distroless/nodejs22-debian12` を実行ステージに使う。
  esbuild でバンドル済みなので `node_modules` を含まず、`index.js` だけで動く。
  ⚠ **drizzle-kit は入れない**（生成専用の dev ツールで、適用は drizzle-orm の migrator で完結する）。

## 本番マイグレーション

🔴 **migrate / seed を server と同じ image に同梱し、使い捨てコンテナとして明示的に実行する。**

```
docker compose run --rm --no-deps <server サービス> migrate.js
docker compose run --rm --no-deps <server サービス> seed.js
```

- **同じ image に入れる**ことで、適用する SQL とサーバのコードのバージョンが構造的に一致する。
- **起動時の自動適用にはしない。** 失敗時の挙動と、インスタンスが増えたときの競合が読めなくなるためである。
- ⚠ **distroless の `ENTRYPOINT` は暗黙に `node` なので、渡すのはパスだけである**
  （`["node", "/app/migrate.js"]` と書くと node に node を渡すことになり動かない）。
- ⚠ **生成済み SQL はバンドルに含まれない。** migrator が実行時に fs で読むため、
  Dockerfile で `drizzle/` フォルダごと COPY している。ここを忘れると、
  マイグレーションを流すまで気づけない。
- ⚠ **先に `pnpm db:generate` の生成物を commit し、その commit からビルドした image を push すること**
  （[03](./03-data-model.md)）。

### 初回適用はベースライン化が要る

⚠ 既存データを持つ本番 DB に初回 migration をそのまま流すと、`Projects` / `Tasks` の
`CREATE TABLE` が既存テーブルと衝突して失敗する（[03](./03-data-model.md)）。

**適用済みとして記録だけを入れる（ベースライン化する）**、というのが方針である。
🔒 **手順とスクリプトはリポジトリに置かない。**

## 本番運用について書かないこと

🔒 次はこの文書にも `prd/` の他の章にも書かない。リポジトリ外のローカルメモに置く。

- 実ドメイン名（`<frontend-domain>` / `<api-domain>` / `<dev-host>` / `<root-domain>` / `<owner>`
  のプレースホルダを使う）
- TLS 証明書の取得・更新、リバースプロキシ / トンネルの設定
- VPS の事業者名・ホスト名・実スペック
- env の値、資格情報、cookie の値
- 本番動作確認のチェックリストや運用スクリプト
