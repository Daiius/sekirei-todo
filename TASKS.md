# 次に行う作業

last updated: 2026-05-04

## 本番リリース確定までの残作業

### 1. 本番 DB スキーマ適用

旧 schema (next-auth 想定) → 新 schema (better-auth) への移行が未適用。

差分:
- `Tasks.userId` / `Projects.userId`: `varchar(128)` → `varchar(36)` (FK to user.id)
- `tasks.userId` / `projects.userId` に user.id への FK 制約追加
- 新規テーブル: `user`, `session`, `account`, `verification`

手順:
1. SSH トンネルで本番 DB を localhost に転送 (cloudflared / ssh -L)
2. **管理者権限のあるユーザ** で `drizzle-kit push --force` を直接実行
   ```sh
   DB_HOST=127.0.0.1 \
   MYSQL_USER=<admin> \
   MYSQL_PASSWORD=<admin-password> \
   MYSQL_DATABASE=sekirei_todo \
   pnpm --filter database exec drizzle-kit push --force
   ```
   (`pnpm db:migrate` は dev 用 env を source するので本番には使わない)
3. データ損失警告は出るが、既存データは新サイズに収まるので実害なし

### 2. 過去タスク復旧用の account レコード挿入 (任意)

旧 `tasks.userId` は GitHub numeric ID。better-auth はログイン時に新 UUID で `user` を作るため、放置すると過去タスクは孤立する。

復旧したい場合:
```sql
-- 自分の GitHub numeric id が 5844472 と仮定
INSERT INTO user (id, name, email, email_verified, created_at, updated_at)
VALUES ('5844472', '<your-name>', '<github-login>@github.placeholder.local', true, NOW(3), NOW(3));

INSERT INTO account (id, account_id, provider_id, user_id, created_at, updated_at)
VALUES (UUID(), '5844472', 'github', '5844472', NOW(3), NOW(3));
```

これで GitHub login → better-auth が既存 account を発見 → user.id='5844472' で session 確立 → 旧 tasks 表示。

(過去タスクが不要なら何もしない、`DELETE FROM Tasks WHERE userId='5844472';` でクリーンアップしてもよい)

### 3. 本番動作確認

- Vercel の Production deploy 完了確認
- ログインフロー: `/` → Sign-in by Github → 認可 → `/tasks` でユーザ名表示
- タスク CRUD: 追加 / 完了切替 / 削除
- ログアウト → `/` に戻る

## 改善余地 (緊急性なし)

### eslint 復活

`next lint` が Next.js 15 で廃止されたため eslint 関連の dev deps を一旦削除した。気が向いたら flat config + `eslint-config-next` で復活させる。

### Storybook の動作確認

`scripts.storybook` は残っているが、現在の Next.js 16 / React 19 構成で動作するかは未確認。

### server-ts の test

server-ts に vitest 等を入れていない。tasks API の e2e test を追加するなら ghcr.io ビルド前のチェックポイントとして良さそう。

### CSRF 対策の見直し

better-auth は trustedOrigins / cookie sameSite で守っているが、本番運用に入ったら一度設定を見直す。特に Vercel preview deployment を使う場合 trustedOrigins に追加する。

### honox の整理

`honox/` は実験で作って未使用のまま。catalog に乗せて依存だけ最新化したが、使わないなら削除候補。

## 構成の経緯メモ

詳細は git log と過去のディスカッションを参照。要点:

- 当初 better-auth は Next.js 側に置こうとしたが、Vercel から VPS の MySQL に到達できないため server-ts に移した
- `api.<root>/sekirei-todo/...` の path-prefix 構成で詰まった (better-auth の router basePath と nginx strip 後の path が一致せず 404)
- 専用サブドメイン (`<api-domain>:8443`) を切って解決
- cookie 共有のため `COOKIE_DOMAIN=.<root-domain>` を設定 (parent domain cookie)
