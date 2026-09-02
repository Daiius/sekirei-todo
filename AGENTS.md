# AGENTS.md

> このファイルがリポジトリの**正典**です（使用する各コーディングエージェント共通）。簡潔・リンク中心に保つこと。
> 仕様の詳細は [`prd/`](./prd/)、進行中の課題は GitHub Issues を参照。

## プロジェクト目的

セキレイをモチーフにした**個人用**の Todo Web アプリ。
Next.js (Vercel) + Hono (VPS) + MySQL (VPS) の構成で、GitHub OAuth でログインし
プロジェクト単位でタスクを管理する。
→ 詳細は [`prd/README.md`](./prd/README.md)。

## ドキュメント（PRD）

| 文書 | 内容 |
|---|---|
| [prd/README.md](./prd/README.md) | 目的 / スコープ / アーキ概観 / 索引 / 公開リポジトリでの秘匿方針 |
| [prd/01-architecture.md](./prd/01-architecture.md) | 単一オリジン構成 / ワークスペース分割 / パッケージ間の責務 |
| [prd/02-auth.md](./prd/02-auth.md) | better-auth / GitHub OAuth / session と cookie / `tasks.userId` の意味論 |
| [prd/03-data-model.md](./prd/03-data-model.md) | DB スキーマ（Users / Projects / Tasks / better-auth テーブル）とマイグレーション方式 |
| [prd/04-dev-environment.md](./prd/04-dev-environment.md) | ローカル dev / リモート dev / dev セッション発行 / env ファイル構成 |
| [prd/05-deploy.md](./prd/05-deploy.md) | Vercel / VPS / ghcr.io / 本番マイグレーション（姿勢のみ） |

## 技術スタック / 構成

**ブラウザから見えるオリジンは 1 つだけ**（ローカル dev / リモート dev / 本番いずれも同じ形）。

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

- **認証**（`SignInButton` / `SignOutButton` の `authClient`）はブラウザから走るが、叩き先は
  自分と同じオリジンの `/api/auth/*` で、Vercel の rewrite が VPS へ転送する。
- **タスク CRUD**（`nextjs/src/actions/tasksActions.ts`）と `getSession`（`nextjs/src/lib/auth.ts`）は
  Server Action / サーバ側 fetch なので rewrite を通さず `API_URL` を直接使う。
- API ドメインは**残る**（rewrite の宛先は絶対 URL なので公開 DNS 名と TLS 証明書が要る）。
  役割が「ブラウザ向けの公開エンドポイント」から「Vercel だけが叩く裏口」に変わっただけ。
  ⚠ ユーザー判断により、VPS への直アクセス対策（共有シークレットヘッダ等）は入れていない。
- 同一オリジンなので cookie は **host-only + `SameSite=Lax`** で足りる。
  `COOKIE_DOMAIN` / `crossSubDomainCookies` / `CORS_ORIGINS` は**廃止**した。

⚠ **注意点**

- ブラウザ → Vercel → VPS と **1 ホップ増える**。`/api/*` は Vercel の関数を経由するので、
  **関数の実行時間上限とレスポンスサイズ上限**が効く。大きいレスポンスや長時間処理を `/api/*` に載せない。
- rewrite は `beforeFiles` ではなく **`afterFiles`**（`rewrites()` が配列を返す形）。つまり
  **Next.js 側に `app/api/**` を作るとそちらが優先され**、rewrite まで届かなくなる。
  Next.js に API Route を足すときは server-ts のパスと衝突しないか確認すること。

**なぜ better-auth が server-ts 側にあるか**: Next.js (Vercel) から VPS の MySQL へ直接接続できない。
そのため drizzleAdapter を使う better-auth は VPS 上の server-ts に置き、
Next.js は HTTP 経由で session を確認する形にしている。

**主要バージョン**: Node.js 22（本番 container は `gcr.io/distroless/nodejs22-debian12`）/
pnpm 10.33.2 (corepack) / Next.js 16.2.x（Turbopack・`cacheComponents=true`）/ React 19.2.x /
TypeScript 6.x / Hono 4.12.x + @hono/node-server v2 / drizzle-orm・drizzle-kit 1.0-rc.1 /
better-auth 1.7.x / MySQL 8.4。

### パッケージ

pnpm workspace。`pnpm-workspace.yaml` の catalog で typescript / @types/node / hono / zod /
drizzle 系のバージョンを共通化している（`minimumReleaseAge: 4320` = 公開 3 日未満のバージョンは選ばない）。

| パッケージ | 役割 | デプロイ先 |
|---|---|---|
| [`nextjs/`](./nextjs) | Next.js アプリ（UI / Server Actions） | Vercel |
| [`server-ts/`](./server-ts) | Hono API + better-auth | VPS（ghcr.io 経由の Docker image） |
| [`database/`](./database) | drizzle スキーマ + 共通 DB クライアント + migrate / seed エントリ | （依存として両方から使用） |
| [`honox/`](./honox) | 実験用（現在未使用・依存の最新化のみ） | - |

## 開発コマンド

database / server-ts / nextjs の 3 つとも compose で動かす。ホストに公開するポートは **nextjs の 1 本だけ**。

```sh
pnpm install                  # 初回 / lockfile 変更時のみ

pnpm dev                      # docker compose up --build --watch → http://localhost:3000
pnpm db:migrate               # 生成済み SQL を適用（稼働中の server-ts コンテナ内で実行）
pnpm db:seed                  # テストデータ投入（冪等）
pnpm db:generate              # スキーマから SQL 生成（DB には接続しない）
pnpm dev:session              # dev 用 session cookie を発行（OAuth を通さずログイン済みにする）

pnpm dev:remote               # リモート dev（.env.remote 差分のみ・Cloudflare Tunnel 越し）
pnpm dev:remote:logs / :down

pnpm stop / pnpm down         # 停止 / コンテナ + ネットワーク削除
docker compose down -v        # mysql-data volume も消して完全リセット
```

- `pnpm dev` は `docker compose watch` ではなく **`up --build --watch`**（`watch` 単体だと
  コンテナが起動しないことがあったため）。
- `db:migrate` / `db:seed` / `dev:session` は **`docker compose exec server-ts`** 経由。
  **`pnpm dev` が上がっている必要がある**（未起動ならそのまま失敗する）。
- DB に直接つなぐ: `docker compose exec database mysql -u"$MYSQL_USER" -p"$MYSQL_PASSWORD" "$MYSQL_DATABASE"`
  （環境変数はコンテナ内にあるのでそのまま参照できる）。

> 🔒 **compose の操作・`db:migrate` / `db:seed` / `dev:session`・成果物ビルドは、セッションの主体が行う。**
> これらは共有資源（稼働中の dev スタック・DB・ビルドキャッシュ）に触るので、
> subagent や並列タスクから叩かない。ユーザーが実際に使っている dev スタックを落としうる。

### env ファイル構成（すべて gitignore 対象・clone 直後は手元で作成が必要）

| ファイル | 内容 | 主な利用元 |
|---|---|---|
| `.env.database` | `MYSQL_*`・`DB_HOST`・`TEST_USER_ID`・`TEST_GITHUB_ID` | database コンテナ / db:migrate / db:seed |
| `.env.server-ts` | `BETTER_AUTH_SECRET`・`GITHUB_CLIENT_*` | server-ts コンテナ |
| `.env.nextjs` | `API_URL` ほか（`nextjs/.env.local` が symlink で参照） | Next.js dev / build |
| `.env.remote` | リモート dev の差分 3 変数（雛形は `.env.remote.example`） | `pnpm dev:remote` |

- dev では `BETTER_AUTH_URL` / `TRUSTED_ORIGINS` を compose の `environment:` が `PUBLIC_ORIGIN`
  から配るので、env ファイル側の同名の値は上書きされる。
- `docker compose restart` は env_file を再ロードしない →
  `docker compose up -d --force-recreate <service>` を使う。
- `NEXT_PUBLIC_*` は build 時にバンドルへ焼き込まれる → dev は `next dev` 再起動、本番は redeploy。

### リモート dev（`pnpm dev:remote`）

常駐マシン上の dev スタックを Cloudflare Tunnel + Access 越しに手元ブラウザから使う構成。
**リモート専用の compose ファイルは持たない。** 差分は `.env.remote` の 3 変数だけ:

| 変数 | ローカル既定 | remote | 効かせ方 |
|---|---|---|---|
| `WEB_BIND` | `3000`（全 IF） | `127.0.0.1:<port>` | compose の `ports: '${WEB_BIND:-3000}:3000'` |
| `DEV_ALLOWED_HOST` | `localhost` | `<dev-host>` | `next.config.ts` が `allowedDevOrigins` を条件付与 |
| `PUBLIC_ORIGIN` | `http://localhost:3000` | `https://<dev-host>` | compose が nextjs / server-ts の URL 系 env に配る |

**cloudflared は compose 外**（systemd 常駐・token 起動）。ingress ルールと Access のポリシーは
Cloudflare Zero Trust ダッシュボード側だけで管理し、リポジトリにもホストにも設定ファイルを置かない。
HMR は同一オリジンの WebSocket なので、トンネルが wss を通せば追加設定は要らない。

### dev 用セッション発行（`pnpm dev:session`）

`server-ts/scripts/devSession.ts` が既存 user に session を直接発行し、ブラウザに入れる cookie 値を出力する。
E2E や手動確認で「ログイン済み `/tasks`」を作るのに使う。

- cookie 名は `advanced.cookiePrefix: 'sekirei'` により **`sekirei.session_token`**（dev は http なので
  `__Secure-` prefix は付かない）。値は better-call の署名付き形式
  `<token>.<HMAC-SHA256(BETTER_AUTH_SECRET, token) の base64>` を URL エンコードしたもの。
- 対象ユーザは `.env.database` の `TEST_USER_ID`。未設定ならエラーで停止する。先に `pnpm db:seed`。
- cookie は **`httpOnly`** なので Playwright では `document.cookie` ではなく
  `page.context().addCookies()`（`domain: 'localhost'`, `httpOnly: true`, `secure: false`, `sameSite: 'Lax'`）で注入する。
- 🔒 **本番には入らない。** `Dockerfile.prod` は `server-ts/src` だけを COPY し、esbuild も
  `src/index.ts` を入口にするので本番イメージに含まれない。`.dockerignore` にも `server-ts/scripts` を入れ、
  スクリプト自身も `NODE_ENV=production` なら即 exit 1 する（多重防御）。
- ⚠ **`.env.database` の `TEST_GITHUB_ID` が空だと `/tasks/*` が 401 になる。**
  `tasks.userId` は GitHub の numeric id を保持する設計で、`getGitHubAccountId`（`database/db/lib.ts`）が
  `account` から解決できないと `undefined` を返し、`server-ts/src/app.ts` の `/tasks/*` ミドルウェアが 401 を返す。
  session 自体は有効なのに 401 になるので紛らわしい。

### DB マイグレーション

**生成は `drizzle-kit generate`（dev 専用）、適用は drizzle-orm の `migrate()`。**
`drizzle-kit push` は使わない（本番イメージに drizzle-kit を入れずに済み、dev と本番で適用経路が 1 本になる
＝ 本番で初めて走る経路が無い）。適用済みかどうかは drizzle 標準の `__drizzle_migrations` が持つので冪等。

| ファイル | 役割 |
|---|---|
| `database/drizzle/<timestamp>_<name>/migration.sql` | 生成済み SQL。**リポジトリにコミットする** |
| `database/migrate.ts` | 適用エントリ。⚠ **パッケージルート直下**（`migrationsFolder` を自ファイル相対 URL で解くため） |
| `database/seed.ts` | シード投入エントリ（冪等） |
| `database/esbuild.config.ts` | 上記 2 つを `dist/migrate.js` / `dist/seed.js` へバンドル |

スキーマを変えたら: `database/db/*.ts` を編集 → `pnpm db:generate` →
生成された `migration.sql` と `snapshot.json` を目視して commit → `pnpm db:migrate`。
⚠ **生成物を commit し忘れると本番で適用されない。** ここが `push` 時代との一番大きな違い。

## 静的チェック

各ワークスペースで `tsc --noEmit` を走らせる。

```sh
cd database  && ./node_modules/.bin/tsc --noEmit
cd server-ts && ./node_modules/.bin/tsc --noEmit
cd nextjs    && ./node_modules/.bin/tsc --noEmit
docker compose config -q      # compose ファイルの構文確認（⚠ -q を必ず付ける。無いと secret が stdout に出る）
```

- ⚠ **`honox` は静的チェックの対象外**（未使用の実験用パッケージで、`tsc --noEmit` が通らない）。
  判定材料にしない。
- **lint は設定していない**（`next lint` の廃止時に eslint 関連の dev deps を外したまま）。

## Git / PR 運用

- 🔒 **変更対象のパスを明示して stage する。`git add -A` / `git add --all` / `git add .` は使わない。**
  作業ディレクトリに置かれた未追跡ファイル（env のバックアップ等）を巻き込んで push する事故が実際に起きている。
  **コミット前に `git status --short` と `git diff --cached --stat` を目視で確認する。**
- **レビュー中の PR には追加コミットを積む。** `git commit --amend` + `git push --force` はしない
  （レビュー bot がコミット単位で追随でき、対応履歴も追いやすい）。
- **コミットメッセージは Conventional Commits**（`feat:` / `fix:` / `docs:` / `chore:` / `refactor:` / `perf:` …）。
- 最終的な履歴整形は **squash マージ**に任せる（PR タイトルが正典コミットメッセージになる）。

## レビュー bot（oculibis）

PR レビュー bot。設定は [`.github/review-bot.json`](./.github/review-bot.json) の 1 ファイルのみで、
`prd/` と `AGENTS.md` を PRD として宣言している。

- **トリガー**: PR コメントの `@oculibis review`、または `review:now` / `review:enabled` ラベル。
- 🔒 **設定は default branch（`main`）から読まれる。** `.github/review-bot.json` の変更は
  **main に入るまで効かない**。PR head から採用されるのは `prd.paths` への**追加**だけで、
  `prd.type` の変更・宣言済み paths の削除・PRD 未宣言状態からの新規宣言・
  `labels` / `schedulerMode` の変更は head からは効かない。
- **前提**: GitHub App がこのリポジトリにインストールされていること。
- 完了判定は**トリガーコメントの `+1` リアクション**で行う（`eyes` = 受理、`+1` = publish 成功）。
  bot コメントの有無では判定しない（managed comment は 1 つを更新し続けるため）。
- ⚠ **設定できる項目は `prd` / `labels` / `schedulerMode` の 3 つだけ。**
  除外パス・レビュー観点・重大度しきい値・言語指定に相当する項目は存在しない。推測で増やさない。

## 認証（better-auth / GitHub OAuth）

- **OAuth callback URL は公開オリジン（Next.js 側）に向ける。** API ドメインには向けない
  （ブラウザは API ドメインを踏まないため）:
  `https://<frontend-domain>/api/auth/callback/github`（本番）/
  `https://<dev-host>/api/auth/callback/github`（リモート dev）/
  `http://localhost:3000/api/auth/callback/github`（ローカル dev）。
- 🔒 **環境ごとに別の OAuth / GitHub App を使う。** 1 つの App に複数環境の callback URL を
  相乗りさせない（App の実体と運用手順は `.claude/local/` 側）。
- better-auth は **`BETTER_AUTH_URL` から `redirect_uri` を組み立てる**ので、
  `BETTER_AUTH_URL` は**公開オリジン**でなければならない（API ドメインではない）。
- `nextjs/src/lib/auth-client.ts` は `createAuthClient()` を **baseURL 無指定**で呼ぶ
  （ブラウザで `window.location.origin + /api/auth` に解決される）。
  ⚠ 相対パスの baseURL（`'/api/auth'`）は `new URL()` 検証に落ちて例外になるので渡さない。
  `SignInButton` の `callbackURL` は**相対パス `/tasks`**（originCheck は callbackURL に限り相対を許可）。
- ⚠ **`tasks.userId` は GitHub の numeric id を保持する**（旧 next-auth 時代からの設計）。
  better-auth が生成する `user.id`（UUID）とは別物で、`account` テーブル経由で解決する。
  過去のタスクを救出したい場合は `account` レコードを挿入して、login 時に既存 `user.id` へマップさせる。
  ローカルでは `.env.database` の `TEST_GITHUB_ID` を設定すると `database/seed.ts` が自動でセットアップする。

## 公開リポジトリ方針

コード・文書に以下を持ち込まない（詳細は [prd/README.md](./prd/README.md) §秘匿方針）:

- **秘密情報**（`.env*`・`BETTER_AUTH_SECRET`・DB 資格情報・cookie の値・OAuth client secret）。
  `.env*` は**読まない・コミットしない**。
- **実ドメイン名**。文書中では `<frontend-domain>` / `<api-domain>` / `<dev-host>` /
  `<root-domain>` / `<owner>` のプレースホルダを使う。
- 🔒 **本番環境に関する情報は書かない。** デプロイ手順・env の値・TLS・接続先・
  リバースプロキシ・トンネル設定・運用スクリプトは、姿勢の記述も含めて `.claude/local/` に置く。
- 🔒 **一時的な状況の詳細は書かない。** 「いま何件壊れている」「次に何をする」といった、
  時間とともに変わる情報は GitHub Issues に置く。この文書には**恒久的に成り立つこと**だけを書く。

## ローカル専用メモ（存在すれば読む）

`.claude/local/`（gitignore 対象）が**存在する場合は読む**。**デプロイと本番運用に関する
情報はすべてそこにある**（この文書には無い）。個々のファイルは公開文書に列挙しない。
`git add -f` などで追跡下に入れないこと。
