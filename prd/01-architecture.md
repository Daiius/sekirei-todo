# 01. アーキテクチャ

本章はアプリ全体の技術構成・ワークスペース分割・パッケージ間の責務・オリジン設計を定める。
何ができるアプリかは [00](./00-product.md)、認証は [02](./02-auth.md)、
データモデルは [03](./03-data-model.md)、開発環境は [04](./04-dev-environment.md)、
デプロイは [05](./05-deploy.md) に委ねる。

## 単一オリジン構成

**ブラウザから見えるオリジンは 1 つだけ**である。ローカル dev / リモート dev / 本番の
いずれも同じ形をしている。

```
[Browser]
   │
   └── HTTPS ──► [Next.js]   https://<frontend-domain>
                  ・/            → UI / Server Actions
                  ・proxy.ts が未ログインを / にリダイレクト
                  ・/api/*      → next.config.ts の rewrites() が
                                   ${API_URL}/api/* へ素通し（サーバ側 fetch）
                            │
                            ▼  ブラウザは踏まない。フロント側からのみ到達する裏口
                  [server-ts]   https://<api-domain>
                  ・/api/auth/*  → better-auth（GitHub OAuth）
                  ・/tasks/*     → タスク CRUD（session 必須）
                            │
                            ▼
                  [MySQL]
```

ブラウザから走る唯一の API 呼び出しは認証（`SignInButton` / `SignOutButton` の `authClient`）だが、
その叩き先も自分と同じオリジンの `/api/auth/*` であり、`rewrites()` が server-ts へ転送する。
タスク CRUD（`nextjs/src/actions/tasksActions.ts`）と `getSession`（`nextjs/src/lib/auth.ts`）は
Server Action / サーバ側 fetch なので rewrite を通さず `API_URL` を直接使う。

**この構成にした理由は cookie を単純にできることである。** ブラウザから見て cookie は常に
同一オリジンで往復するので、**host-only + `SameSite=Lax`** の既定で足りる。
親ドメイン発行（`COOKIE_DOMAIN` / `crossSubDomainCookies`）も CORS（`CORS_ORIGINS`）も不要になり、
これらは**廃止した**。プリフライトがそもそも発生しない。

API 用のドメインは**残る**。rewrite の宛先は絶対 URL なので、公開 DNS 名と TLS 証明書が要るためである。
役割が「ブラウザ向けの公開エンドポイント」から「フロント側だけが叩く裏口」に変わっただけである。

⚠ **注意点**

- ブラウザ → Next.js → server-ts と **1 ホップ増える**。`/api/*` はホスティング側の関数を経由するので、
  **関数の実行時間上限とレスポンスサイズ上限**が効く。大きいレスポンスや長時間処理を `/api/*` に載せない。
- rewrite は `beforeFiles` ではなく **`afterFiles`**（`rewrites()` が配列を返す形）である。つまり
  **Next.js 側に `app/api/**` を作るとそちらが優先され**、rewrite まで届かなくなる。
  Next.js に API Route を足すときは server-ts のパスと衝突しないか確認すること。
- ⚠ **裏口への直アクセス対策（共有シークレットヘッダ等）は入れていない。** ユーザー判断による
  意図的な選択であり、実装漏れではない（[05](./05-deploy.md)）。

### なぜ better-auth が server-ts 側にあるか

フロントを置いているホスティングから VPS の MySQL へ直接接続できないためである。
drizzleAdapter を使う better-auth は DB との接続を前提にするので、VPS 上の server-ts に置き、
Next.js は HTTP 経由で session を確認する形にしている（[02](./02-auth.md)）。

## インフラの置き場所とその理由

Next.js は PaaS、API と DB は自前の VPS に置いている。実スペックや事業者名はここには書かないが、
判断の理由は次のとおりである。

- **公開サーバとしている VPS のメモリが小さい。** Next.js をセルフホストすると数百 MB を使うため、
  同居している他サービスごとホストするのが難しい。フロントだけを PaaS に逃がしている。
- **DB は自前ホストに置く方が都合が良い。** ディスクに余裕があり、**バックアップを本番環境ごと
  取れる**。マネージド DB に出すとバックアップ経路が 2 本に割れてしまう。
- **DB にアクセスする API サーバも DB と同じ VPS に置く。** DB とアプリの間にネットワーク境界を
  作らないためである。
- **認証は BFF の裏の API サーバに持たせる。** Next.js の middleware に認証の脆弱性
  （CVE-2025-29927）が問題になった経緯があり、**middleware を防御の本体にしない**設計にしている
  （[02](./02-auth.md) §防御の位置）。

### 非機能要件: インフラ構成の差し替えやすさ

**どんなインフラ構成にも柔軟に対応できる形にしておきたい**、という理想を持っている。
上記の置き場所はいまの制約に対する解であって、前提が変われば置き換えられるべきである。

現状その差し替え境界は次の 2 点になっている。

| 境界 | 何を差し替えられるか |
|---|---|
| `API_URL` | API サーバの置き場所（同一ホスト / 別ホスト / compose 網内） |
| `database` パッケージの接続設定（`DB_HOST` ほか） | DB の置き場所 |

この 2 つ以外に環境依存の分岐を増やさないことを方針とする。

## パッケージ分割

pnpm workspace で 4 つに分けている。

| パッケージ | 役割 | 依存 |
|---|---|---|
| [`nextjs/`](../nextjs) | UI / Server Actions。ブラウザに配る側 | `server-ts`（**型のみ**）/ `better-auth`（クライアント） |
| [`server-ts/`](../server-ts) | Hono API + better-auth。DB に触る唯一のサーバ | `database` |
| [`database/`](../database) | drizzle スキーマ + 共通 DB クライアント + migrate / seed エントリ | - |
| [`honox/`](../honox) | 実験用。**現在未使用**（下記） | - |

依存方向は `nextjs → server-ts → database` の一方向で、逆流させない。

⚠ **`nextjs` が `server-ts` に依存しているのは型のためだけである。** `server-ts/package.json` の
`exports` は `types` だけを公開し（`./src/app.ts`）、Next.js 側は `hc<AppType>`（Hono の
型付きクライアント）で API の型を共有する。実行時に server-ts のコードが Next.js のバンドルへ
入ることはない。

### バージョンの共通化

`pnpm-workspace.yaml` の catalog で `typescript` / `@types/node` / `hono` / `zod` / drizzle 系の
バージョンを一元管理し、パッケージ側では `catalog:` と書く。ワークスペース間でバージョンが
ずれると、型の共有（上記 `AppType`）と DB スキーマの共有が壊れるためである。

`minimumReleaseAge: 4320`（= 3 日）を設定し、**npm に公開されてから 3 日未満のバージョンは選ばない**。
公開直後の不正パッケージや事故リリースを踏まないための猶予である。

## 主要技術の選定

| 技術 | 選定理由 |
|---|---|
| **Next.js 16（Turbopack・`cacheComponents`）** | Server Component / Server Action を試すことがこのアプリの目的の一つ（[00](./00-product.md)）。新しい API に追従することを優先する |
| **Hono + @hono/node-server** | 軽量で、小さい VPS に載せるコンテナに向く。`hc<AppType>` でフロントと型を共有できることが決め手 |
| **drizzle-orm 1.0-rc** | 1.0 のリリースが近く、schema や relation の定義方法が変わるため、**先に新しい方へ追従する**意図で採用した。特定の rc 版を狙ったわけではない。⚠ バージョン指定の方針は [03](./03-data-model.md) を参照 |
| **MySQL 8.4** | 旧構成からの継続。既存データをそのまま引き継いでいる |
| **Node.js 22 / distroless** | 本番コンテナを小さく保つため（[05](./05-deploy.md)） |

## gap / 検討中

現状が理想に追いついていない箇所と、判断を保留している箇所である。

### 実装の gap

- **失敗が画面に出ない。** あるべき姿は「**失敗を画面に出す**」「**401 はサインイン導線へ誘導する**」
  である。現状は Server Action が `console.error` を出すだけで、画面は何も変わらない。
  cookie だけ残ってセッションが切れた状態では `/tasks` に留まり空の一覧が出る、という
  分かりにくい挙動もここに起因する（[00](./00-product.md) / [02](./02-auth.md)）。
- **タスクの並び順が無保証。** `createdAt` **昇順**を仕様とするが、`getTasks`（`database/db/lib.ts`）に
  `orderBy` の指定が無く、現状の並びは DB 任せである。
- **server-ts のテスト基盤が無い。** API の振る舞いを固定するテストを置きたいが未整備。
- **eslint が無い。** `next lint` の廃止時に eslint 関連の dev deps ごと外したままである。
  flat config で復活させることを計画中（[04](./04-dev-environment.md)）。

### 検討中

- **オフライン対応。** 初期構想にあった「localStorage と Client Component である程度の
  オフライン使用に耐える」は、**非目標ではなく長期の検討事項**である。当面やらないが、
  Next.js の題材としては興味がある。実現するなら、Server Action の結果を待たずに画面を
  更新する**楽観更新層**が要る（現状の「debounce して投げっぱなし」とは別の設計になる）。
- **`honox/` の去就。** **判断保留**である。中身は HonoX の island アーキテクチャの試作
  （`app/islands/counter.tsx`）、自作 Vite プラグインによるフォントサブセット化
  （`plugins/vite-plugin-font-subset.ts`）、daisyUI + Tailwind v4、および Next.js 版と
  同等の UI の移植である。現在アプリ本体からは使われておらず、依存の最新化だけ追従している。
  ⚠ **`tsc --noEmit` が通らないのは、`package.json` の scripts が存在しない `src/index.ts` を
  指しているためである**（実体は `app/`）。壊れているのは設定であってコードではないが、
  未使用なので静的チェックの対象から外している（[04](./04-dev-environment.md)）。
