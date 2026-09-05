# 03. データモデルとマイグレーション

本章は DB スキーマとマイグレーションの方式を定める。
識別子の意味論は [02](./02-auth.md)、適用の運用は [04](./04-dev-environment.md) /
[05](./05-deploy.md)。

## 全体像

アプリ本体の `Projects` / `Tasks` と、better-auth が使う `user` / `session` / `account` /
`verification` の 2 系統がある。前者は `database/db/schema.ts`、後者は
`database/db/auth-schema.ts` に定義され、`schema.ts` が auth-schema を再エクスポートする。

```
user ||--o{ session
user ||--o{ account
                 ┆ account.accountId（GitHub numeric id）
                 ┆   ※ FK ではなくアプリ層の解決
Users ||--o{ Projects
Users ||--o{ Tasks
Tasks }o--o| Projects
```

- 1 人のユーザから見て、Tasks も Projects も 0 個かもしれないし多数かもしれない。
- 1 つの Task / Project から見て、ユーザはただ 1 人である。
- 1 つの Task から見て、Project は 0 個かただ 1 つである。

🔴 **この形は所有者 1 人を前提にしている。** ユーザ間でのタスク / プロジェクト共有は
**設計に含めない**（[00](./00-product.md) §非目標）。共有を入れるならこのモデルごと作り直しになる。

## アプリ本体のテーブル

### `Projects`

| 列 | 型 | 制約 |
|---|---|---|
| `id` | `varchar(256)` | NOT NULL / UNIQUE。**プロジェクト名そのもの** |
| `userId` | `varchar(36)` | NOT NULL。GitHub numeric id（[02](./02-auth.md)） |
| `createdAt` | `timestamp` | DEFAULT now() |

複合主キーは **`(id, userId)`**。

⚠ **プロジェクト名がそのまま ID なのでリネームできない。** 名前を変えることは
別レコードを作ることと同義であり、`Tasks.projectId` の付け替えが要る。
サロゲートキーへ移すかどうかは、UI 仕様を決める時点で併せて判断する（下記）。

### `Tasks`

| 列 | 型 | 制約 |
|---|---|---|
| `id` | `serial` | NOT NULL / 自動採番 |
| `userId` | `varchar(36)` | NOT NULL。GitHub numeric id |
| `projectId` | `varchar(256)` | nullable。`Projects.id` への FK |
| `description` | `varchar(512)` | NOT NULL。⚠ **DB 上の列名は `content`** |
| `createdAt` | `timestamp` | DEFAULT now() |
| `done` | `boolean` | NOT NULL / DEFAULT false |

複合主キーは **`(id, userId)`**。

- ⚠ **TypeScript 側の名前 `description` と DB の列名 `content` が食い違う。** 旧構成からの
  引き継ぎで、SQL を直接書くときは `content` である。API・型・UI はすべて `description`。
- ⚠ **`done` はどこからも使われていない。** 「完了 = 削除」を仕様として選んだため
  （[00](./00-product.md) §タスクの完了）、書き込みも読み出しも無い。
  **将来の削除候補**として扱う。削除する場合は既存の値を捨てて構わない。
- **並び順は `createdAt` 昇順を仕様とする。** ⚠ 現状 `getTasks` に `orderBy` の指定が無く
  無保証である（[01](./01-architecture.md) §gap / 検討中）。

### `Projects` は未実装の gap

スキーマは上記のとおり存在するが、**UI にも API にも `Projects` を扱う経路が無い**。
`server-ts/src/app.ts` の route は `/tasks` だけで、Server Action にもプロジェクトの
取得・作成は無い。タスクは常に `projectId` が NULL のまま作られる。

🔴 **UI 仕様は未決定である。** 未分類タスクを許すか、サイドバーで切り替えるか一覧の見出しにするか、
リネームを認めるか（上記の ID 問題）は**いずれも要確認**であり、**実装に着手する時点で決める**。
あるべき画面の形をここに先に書くことはしない。

## better-auth のテーブル

better-auth 1.7 のスキーマに合わせている。ここは better-auth の要求が正典であり、
勝手に列を足さない。

| テーブル | 主な列 |
|---|---|
| `user` | `id` varchar(36) PK / `name` / `email`（UNIQUE）/ `email_verified` / `image` / `created_at` / `updated_at` |
| `session` | `id` PK / `expires_at` / `token`（UNIQUE）/ `ip_address` / `user_agent` / `user_id` → `user.id`（ON DELETE CASCADE） |
| `account` | `id` PK / `issuer` / `account_id` / `provider_id` / `user_id` → `user.id`（CASCADE）/ 各種トークン列 / `scope` / `password` |
| `verification` | `id` PK / `identifier` / `value` / `expires_at` |

- ⚠ **`account` の identity は `(issuer, accountId)` にスコープされる**（better-auth 1.7 の変更）。
  独自の issuer を持たない OAuth provider には `local:oauth:<providerId>` が入るので、
  GitHub なら `local:oauth:github` である。この複合に UNIQUE index
  （`account_issuer_accountId_idx`）を張っているため、`account_id` は `text` ではなく
  `varchar(255)` にしてある。
- index は `session_userId_idx` / `account_userId_idx` / `verification_identifier_idx`。

### relations

`database/db/relations.ts` の `defineRelations` では、`user ↔ session` / `user ↔ account` /
`tasks ↔ projects` だけを張る。⚠ **`tasks` / `projects` と `user` の relation は張らない。**
これらの `userId` は `user.id` ではなく `account.accountId` を指しており、drizzle の relations は
単純な等価結合しか表現できないためである。解決はアプリ層で行う（[02](./02-auth.md)）。

## マイグレーション方式

🔴 **生成は `drizzle-kit generate`（dev 専用）、適用は drizzle-orm の `migrate()`。**
`drizzle-kit push` は使わない。

理由は 2 つある。

- **本番イメージに drizzle-kit を入れずに済む。** 適用は drizzle-orm の migrator だけで完結する。
- **dev と本番で適用経路が 1 本になる。** 本番で初めて走る経路が無くなる。

適用済みかどうかは drizzle 標準の `__drizzle_migrations` テーブルが持つので、
何度流しても冪等である。

### ファイル配置

| ファイル | 役割 |
|---|---|
| `database/drizzle/<timestamp>_<name>/migration.sql` | 生成済み SQL。**リポジトリにコミットする** |
| `database/drizzle/<timestamp>_<name>/snapshot.json` | 生成の基準となるスキーマのスナップショット。**同じくコミットする** |
| `database/migrate.ts` | 適用エントリ。⚠ **パッケージルート直下**（下記） |
| `database/seed.ts` | シード投入エントリ（冪等） |
| `database/esbuild.config.ts` | 上記 2 つを `dist/migrate.js` / `dist/seed.js` へバンドル |
| `database/drizzle.config.ts` | 生成側の設定（schema / out / dialect / 接続情報） |

⚠ **`migrate.ts` はパッケージルート直下でなければならない。** `migrationsFolder` を
**自ファイルからの相対 URL**（`new URL('./drizzle', import.meta.url)`）で解いているため、
dev では `database/drizzle` を、バンドル後は `/app/drizzle` を指す必要がある。
下の階層に置くと両者がずれる。cwd 相対にしないのは、どこから叩くかで壊れるためである。

⚠ **生成済み SQL はバンドルに含まれない。** migrator が実行時に fs で読むので、
本番イメージには `drizzle/` フォルダごと COPY する（[05](./05-deploy.md)）。

### 手順

スキーマを変えたら次の順で進める。

1. `database/db/*.ts` を編集する。
2. `pnpm db:generate` で SQL を生成する（DB には接続しない）。
3. 生成された `migration.sql` と `snapshot.json` を**目視で確認して commit する**。
4. `pnpm db:migrate` で適用する。

⚠ **生成物を commit し忘れると本番で適用されない。** `push` 方式との一番大きな違いがここである。

### drizzle のバージョン指定

🔴 **rc の間は完全固定する。** `pnpm-workspace.yaml` の catalog で
`drizzle-kit` / `drizzle-orm` を `1.0.0-rc.1` と書き、**`^` を付けない**。
**1.0 安定版が出たら、他の依存と同じく `^` に戻す。**

理由は**生成 SQL の再現性**である。このリポジトリは生成済み SQL をコミットする方式なので、
drizzle-kit のバージョンが不意に上がると生成される `migration.sql` / `snapshot.json` が変わり、
それがそのまま本番へ流れる。rc の間は破壊的変更が入り得るので、上がるタイミングを
手で決められる状態にしておく。

なお 1.0-rc を選んだのは、1.0 のリリースが近く schema や relation の定義方法が変わるため、
**先に新しい方へ追従する**意図による（[01](./01-architecture.md)）。特定の rc 版を狙ったわけではない。

## シード

`pnpm db:seed`（`database/seed.ts`）は dev / 検証用のテストデータを投入する。
**冪等**であり、何度流しても同じ最終状態に収束し、削除はしない。

| 環境変数 | 効果 |
|---|---|
| `TEST_USER_ID` | この id で better-auth の `user` レコードを upsert する。未設定なら既定値を使う |
| `TEST_GITHUB_ID` | 設定されていれば `account`（`providerId='github'`、issuer は `local:oauth:github`）を upsert し、`TEST_USER_ID` の user に紐付ける |

- `(issuer, accountId)` に UNIQUE index があるので、`account` の upsert はそのまま冪等になる。
- `Tasks` は自動採番 id しか持たず自然キーが無いので、upsert ではなく
  「その所有者のタスクが 1 件も無いときだけ入れる」形で冪等にしている。
- タスクの所有者は `TEST_GITHUB_ID`（未設定なら `TEST_USER_ID`）である。
  ⚠ **`TEST_GITHUB_ID` が未設定だと、GitHub でログインしても所有者が一致せずタスクが見えない**
  だけでなく、`/tasks/*` が 401 になる（[02](./02-auth.md) / [04](./04-dev-environment.md)）。

## 本番 DB のベースライン化

⚠ **既存データを持つ本番 DB に初回の migration をそのまま流すと失敗する。** 初回 migration は
`Projects` / `Tasks` を `CREATE TABLE` するが、これらは旧構成の時点で既に存在するためである。

**適用済みとして記録だけ入れる（ベースライン化する）**、というのが方針である。
手順とスクリプトは**リポジトリに置かない**（[05](./05-deploy.md) / [README.md](./README.md) §秘匿方針）。
