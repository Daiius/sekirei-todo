# 次に行う作業

last updated: 2026-05-04

## 本番リリース確定までの残作業

### 1. 本番 DB スキーマ適用

旧 schema (next-auth 想定) → 新 schema (better-auth + account 経由参照) への移行が未適用。

方針: `tasks.userId` / `projects.userId` は GitHub の numeric id を保持し続け、
ログイン時は `account` テーブル経由で session.user.id (UUID) → GitHub id を解決する。
これで旧データの userId をいじる必要がなく、純粋にスキーマ追加 + FK 削除だけで済む。

差分:
- `tasks.userId` / `projects.userId` の `user.id` への FK 制約を削除
  (GitHub numeric id を保持するので user.id とは一致しない)
- カラム長は `varchar(128)` → `varchar(36)` (既存 GitHub numeric id は 8 桁程度なので問題なし)
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

### 2. 本番動作確認

- Vercel の Production deploy 完了確認
- ログインフロー: `/` → Sign-in by Github → 認可 → `/tasks` でユーザ名表示
- タスク CRUD: 追加 / 完了切替 / 削除
- ログアウト → `/` に戻る

## 将来検討: ursa-auth (自前 IdP) への統合

`~/sources/ursa-auth` を OIDC Provider、sekirei-todo を OIDC Client として組み直す案。
本番 push が安定したあと、**ursa-auth 側の test phase が落ち着いたタイミング**で着手する。

### モチベーション

複数の個人アプリ (sekirei-todo / 将来の他のアプリ) ごとに better-auth の
`user/session/account/verification` を持つのは冗長。ursa-auth に IdP を寄せれば
sekirei-todo 側のテーブルは tasks/projects だけで済む。一度入れ替えれば二つ目以降の
アプリは redirect URL を ursa-auth に登録するだけで済む = SSO 化。

### sekirei-todo にとっての相性 (調査結果サマリ)

- ursa-auth は `oidcProvider` + `jwt` plugin で **`/api/auth/oauth2/{authorize,token,userinfo}` と JWKS をすでに提供**
- 重要: ID token / userinfo に `<provider>_id` claim (例 `github_id: "5844472"`) を載せる仕組み
  (`getAdditionalUserInfoClaim` で account テーブルから自動投入) がある
  → sekirei-todo は今と同じ「**tasks.userId に GitHub numeric id を保持**」をそのまま続けられる
- ursa-auth の `.ursa-auth.config.json` には `https://sekirei.faveo-systema.net` がすでに
  `allowedRedirectPatterns` に登録されており、本統合を想定して設計されている
- `examples/next` に **そのまま流用できる OIDC client 実装**が存在
  (`/ursa-auth/start-signin` → ursa-auth → `/ursa-auth/callback` → access_token を cookie 保存)
- `examples/api-server/src/middlewares.ts` の `ursaAuthMiddleware` は cookie を ursa-auth の
  `/api/auth/get-session` に転送して検証する例。server-ts に流用可

### 想定する統合形

```
[browser]
   ├─► next.<domain>/ursa-auth/start-signin
   │     └─► ursa.<domain>/api/auth/oauth2/authorize
   │           └─► ursa.<domain>/signin → GitHub OAuth
   │                 └─► next.<domain>/ursa-auth/callback (code 交換 → access_token を cookie 保存)
   └─► next.<domain>/tasks (Server Action)
         └─► server-ts (cookie 転送)
               └─► ursa.<domain>/api/auth/oauth2/userinfo (Bearer access_token)
                   → claims.github_id を tasks.userId として使用
```

ID token を `jose` でオフライン検証する形にすれば userinfo 問い合わせも不要にできる
(`/api/auth/jwks` から公開鍵取得)。

### 想定作業ステップ

1. ursa-auth の `oidcClients` に sekirei-todo を登録
   (clientId / secret / redirectUrls=`{dev,prod}/ursa-auth/callback`)
2. sekirei-todo に `nextjs/src/app/ursa-auth/{start-signin,callback}/route.ts` を実装
   (examples/next からほぼコピペ)
3. server-ts の auth middleware を **better-auth の getSession 呼び出しから**
   **ursa-auth の userinfo (or jwks 検証)** に置き換え
4. server-ts と database から better-auth 関連のコード/依存を削除
   (`auth.ts`、`account` lookup 関数、user/session/account/verification スキーマ)
5. 本番 DB から不要になった better-auth テーブルを drop (DROP TABLE で良い、データ捨ててよい)
6. 本番反映後、Sign-in ボタンの遷移先を `/ursa-auth/start-signin` に差し替え

### 留意点

- ursa-auth が "development & experiment phase" を脱してから着手
- 本番では ursa-auth を VPS に常駐させる必要あり (sekirei-todo の単一障害点が増える)
- ursa-auth 側に Redis セッションキャッシュ層があるので auth 問い合わせは比較的軽量
- 移行で sekirei-todo の現 better-auth セッション (cookie) は無効化される。
  ユーザは再ログイン必要 (個人運用なので影響軽微)

### 関連ファイル (調査時点のパス)

- `~/sources/ursa-auth/src/auth.ts` — `getAdditionalUserInfoClaim` で `<provider>_id` claim 注入
- `~/sources/ursa-auth/.ursa-auth.config.json` — `oidcClients` 登録ポイント
- `~/sources/ursa-auth/examples/next/src/app/ursa-auth/{start-signin,callback}/route.ts` — OIDC client 実装の雛形
- `~/sources/ursa-auth/examples/api-server/src/middlewares.ts` — Bearer/Cookie 検証 middleware の雛形

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
