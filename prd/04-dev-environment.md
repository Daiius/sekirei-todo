# 04. 開発環境

本章はローカル / リモートの開発環境と、env の配り方を定める。本番は [05](./05-deploy.md)。

## compose 構成

database / server-ts / nextjs の 3 サービスを `compose.yml` で動かす。
**ホストに publish するポートは nextjs の 1 本だけ**である。

| サービス | image / build | ホストへの公開 |
|---|---|---|
| `database` | `mysql:8.4` | **無し**（compose 網内のみ。3306 は expose もしない） |
| `server-ts` | `Dockerfile.dev` | **無し**（`expose: 4000` のみ） |
| `nextjs` | `Dockerfile.dev` | `${WEB_BIND:-3000}:3000` |

DB と server-ts をホストに出さないのは、**本番と同じ到達経路だけを残す**ためである。
ブラウザは nextjs の `/api` rewrite 経由でしか server-ts に届かず、nextjs 自身
（Server Action / `getSession`）は compose 網内の `server-ts:4000` で届く。
DB を直接触るときは `docker compose exec` を使う。

```sh
pnpm install                  # 初回 / lockfile 変更時のみ

pnpm dev                      # docker compose up --build --watch → http://localhost:3000
pnpm db:migrate               # 生成済み SQL を適用（稼働中の server-ts コンテナ内で実行）
pnpm db:seed                  # テストデータ投入（冪等）
pnpm db:generate              # スキーマから SQL 生成（DB には接続しない）
pnpm dev:session              # dev 用 session cookie を発行

pnpm dev:remote               # リモート dev（.env.remote 差分のみ）
pnpm dev:remote:logs / :down

pnpm stop / pnpm down         # 停止 / コンテナ + ネットワーク削除
docker compose down -v        # mysql-data volume も消して完全リセット
```

- `pnpm dev` は `docker compose watch` ではなく **`up --build --watch`** である。
  `watch` 単体ではコンテナが起動しないことがあったためである。
- `db:migrate` / `db:seed` / `dev:session` は **`docker compose exec server-ts`** 経由なので、
  **`pnpm dev` が上がっている必要がある**（未起動ならそのまま失敗する）。
  DB への接続情報を server-ts コンテナが既に持っているので、ホスト側に env を用意せずに済む。
- **watch の動作はサービスごとに変える。** server-ts と database は `sync+restart`、
  nextjs は `sync` のみである。⚠ nextjs を `sync+restart` にすると保存のたびに dev サーバが
  落ちて Fast Refresh が効かなくなる（`next dev` は自前で変更を拾う）。
  `pnpm-lock.yaml` の変更だけは `rebuild` にする。
- MySQL のデータは `mysql-data` volume に永続化される。作り直すときは `docker compose down -v`。

## オリジンの配り方

環境ごとの差分を**オリジン 1 つに集約**している。`PUBLIC_ORIGIN` を compose の
`environment:` が各サービスへ配る。

| 配り先 | 変数 | 値 |
|---|---|---|
| server-ts | `BETTER_AUTH_URL` | `${PUBLIC_ORIGIN:-http://localhost:3000}` |
| server-ts | `TRUSTED_ORIGINS` | 同上 |
| server-ts | `CORS_ORIGINS` | 空文字（単一オリジンなので不要。[01](./01-architecture.md)） |
| nextjs | `API_URL` | `http://server-ts:4000`（compose 網内の service 名） |
| nextjs | `DEV_ALLOWED_HOST` | `${DEV_ALLOWED_HOST:-localhost}` |

⚠ **compose の `environment:` は env ファイルより強い。** `.env.server-ts` に古い
`BETTER_AUTH_URL` や `CORS_ORIGINS` が残っていても上書きされる（意図的にそうしている）。
同じく `.env.nextjs` の `API_URL` はコンテナ内から到達できない値なので必ず上書きする。

## env ファイル構成

**すべて gitignore 対象**であり、clone 直後は手元で作成が必要である。
🔒 **値そのものは文書に書かない**（変数名と役割だけを書く）。

| ファイル | 内容 | 主な利用元 |
|---|---|---|
| `.env.database` | `MYSQL_*` / `DB_HOST` / `TEST_USER_ID` / `TEST_GITHUB_ID` | database コンテナ / `db:migrate` / `db:seed` |
| `.env.server-ts` | `BETTER_AUTH_SECRET` / `GITHUB_CLIENT_ID` / `GITHUB_CLIENT_SECRET` | server-ts コンテナ |
| `.env.nextjs` | `API_URL` ほか（`nextjs/.env.local` が symlink で参照する） | Next.js dev / build |
| `.env.remote` | リモート dev の差分 3 変数（雛形は `.env.remote.example`） | `pnpm dev:remote` |

- ⚠ **`docker compose restart` は env_file を再ロードしない。** 変更を効かせるには
  `docker compose up -d --force-recreate <service>` を使う。
- ⚠ **`NEXT_PUBLIC_*` は build 時にバンドルへ焼き込まれる。** dev は `next dev` の再起動、
  本番は redeploy が要る。なお単一オリジン化により、現在このアプリは
  `NEXT_PUBLIC_*` を 1 つも必要としない（[05](./05-deploy.md)）。
- ⚠ `nextjs/.env.local` は `.env.nextjs` への symlink なので、`.dockerignore` で除外している
  （COPY するとリンク切れになる。コンテナには compose の env_file から渡す）。

## リモート dev

常駐マシン上の dev スタックを、トンネル + アクセス制御越しに手元のブラウザから使う構成である。

🔴 **リモート専用の compose ファイルは持たない。** 差分は `.env.remote` の 3 変数だけである。

| 変数 | ローカル既定 | remote | 効かせ方 |
|---|---|---|---|
| `WEB_BIND` | `3000`（全 IF） | `127.0.0.1:<port>` | compose の `ports: '${WEB_BIND:-3000}:3000'` |
| `DEV_ALLOWED_HOST` | `localhost` | `<dev-host>` | `next.config.ts` が `allowedDevOrigins` を条件付与 |
| `PUBLIC_ORIGIN` | `http://localhost:3000` | `https://<dev-host>` | compose が URL 系 env に配る（上記） |

`pnpm dev:remote` は `docker compose --env-file .env.remote up --build --watch` である。
`--env-file` は compose の interpolation にしか使われず、コンテナに入る値は
`environment:` が `${...}` 経由で受け取る。

- **リモートでは 127.0.0.1 の 1 ポートだけに束縛する。** 外部 NIC には出さず、
  前段のトンネルからのみ到達させる。
- **トンネルは compose の外**に置き、ingress ルールとアクセスポリシーはサービス側の
  ダッシュボードだけで管理する。**リポジトリにもホストにも設定ファイルを置かない。**
- HMR は同一オリジンの WebSocket なので、前段が wss を通せば追加設定は要らない。
- ⚠ OAuth の callback URL に `https://<dev-host>/api/auth/callback/github` を登録しておくこと
  （[02](./02-auth.md)）。callback URL は複数登録できるが、
  🔒 **環境ごとに別の OAuth App を使う**方針である。

## dev 用セッション発行

`pnpm dev:session`（`server-ts/scripts/devSession.ts`）は、既存 user に session を直接発行して
ブラウザに入れる cookie 値を出力する。**OAuth を通さずに「ログイン済み `/tasks`」を作る**ための
仕組みで、E2E や手動確認に使う。

- 対象ユーザは `.env.database` の `TEST_USER_ID` である。未設定ならエラーで停止するので、
  先に `pnpm db:seed` を流す。
- `auth.api.*` には「既存 user へ無条件に session を発行する」公開 API が無いため、
  `auth.$context` 経由で internalAdapter を直接呼んでいる。
- 出力は `COOKIE=<URL エンコード済みの値>` の 1 行である。cookie の形式は [02](./02-auth.md)。
- cookie は **`httpOnly`** なので、Playwright では `document.cookie` ではなく
  `page.context().addCookies()` で注入する
  （`domain: 'localhost'` / `httpOnly: true` / `secure: false` / `sameSite: 'Lax'`）。

🔒 **本番には入らない。** 多重防御にしてある。

1. `server-ts/Dockerfile.prod` は `server-ts/src` だけを COPY する。
2. esbuild も `src/index.ts` を入口にバンドルする。
3. `.dockerignore` に `server-ts/scripts` を入れてビルドコンテキストから外している。
4. スクリプト自身が `NODE_ENV=production` なら即 `exit 1` する。

⚠ **`TEST_GITHUB_ID` が空だと `/tasks/*` が 401 になる。** session は有効なのに 401 が返るので
紛らわしい。原因は `tasks.userId` の意味論にある（[02](./02-auth.md) / [03](./03-data-model.md)）。

## 静的チェック

各ワークスペースで `tsc --noEmit` を走らせる。

```sh
cd database  && ./node_modules/.bin/tsc --noEmit
cd server-ts && ./node_modules/.bin/tsc --noEmit
cd nextjs    && ./node_modules/.bin/tsc --noEmit
docker compose config -q      # compose ファイルの構文確認
```

- ⚠ **`docker compose config` には `-q` を必ず付ける。** 付けないと env の値が stdout に出る。
- ⚠ **`honox` は静的チェックの対象外である。** 未使用の実験用パッケージで、
  `package.json` の scripts が存在しない `src/index.ts` を指しているため `tsc --noEmit` が
  通らない（実体は `app/`）。**判定材料にしない**（[01](./01-architecture.md)）。
- **lint は現在設定していない。** `next lint` の廃止時に eslint 関連の dev deps を外したままである。
  flat config で復活させることを計画中（[00](./00-product.md)）。
- **テストは未整備である。** `nextjs/package.json` に `scripts.storybook` は残っているが、
  現構成で動くかは**未確認**である。
