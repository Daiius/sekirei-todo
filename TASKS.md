# 次に行う作業

last updated: 2026-09-01

## 本番リリース確定までの残作業

### 1. 本番 DB スキーマ適用

DB マイグレーションは `drizzle-kit push` から「生成済み SQL + drizzle-orm の `migrate()`」方式へ
移行済み（→ `CLAUDE.md` の「DB マイグレーション」節）。日常の適用はイメージに同梱した
`migrate.js` を使い捨てコンテナとして流すだけで済む。

⚠ ただし **本番 DB への初回適用だけは、そのままでは通らない。**
init マイグレーションは `Projects` / `Tasks` も `CREATE TABLE` するため、その 2 テーブルと
実データが既にある本番 DB では 1 文目で落ちる。既存データには触れず、差分だけを当てて
`__drizzle_migrations` に init を適用済みとして刻む**ベースライン化**が要る
（ダンプして作り直す案は採らない）。

ベースライン化スクリプトと手順は、本番運用に関わるためリポジトリには置いていない。
手元の `.claude/local/` を参照すること（gitignore 済み）:

- `.claude/local/prod-db-baseline.sh` — ベースライン化スクリプト（既定は `--check` で DB を変更しない）
- `.claude/local/prod-db-baseline.md` — 適用手順・切り戻し

ベースライン化が済めば、以降は通常のマイグレーション経路（`migrate.js`）に戻る。

### 2. 本番動作確認

単一オリジン化（ブラウザは `https://<frontend-domain>` しか叩かず、`/api/*` は Vercel の
rewrite 経由で VPS の server-ts に届く）に伴い、確認すべき点が変わっている。

前提として確認しておくこと:

- GitHub OAuth App の **Authorization callback URL は公開オリジン側**（`https://<frontend-domain>/api/auth/callback/github`）。
  API ドメインには向けない（ブラウザは API ドメインを踏まないため）。
  ローカル dev / リモート dev (`<dev-host>`) の callback も併存登録してよい
- server-ts の **`BETTER_AUTH_URL` は公開オリジン**（`https://<frontend-domain>`）。
  API ドメインではない。better-auth はここから `redirect_uri` を組み立てる
- `COOKIE_DOMAIN` / `CORS_ORIGINS` はもう読まれない（→ 下の「構成の経緯メモ」）

動作確認:

- Vercel の Production deploy 完了確認
- ログインフロー: `/` → Sign-in by Github → 認可 → `/tasks` でユーザ名表示
- 旧データの表示: 過去のタスクが見えること
  （`tasks.userId` は GitHub の数値 ID を保持する設計で、`account` 経由で解決する。
  `user.id` が新しく振られても過去のタスクは見える）
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
- 重要: ID token / userinfo に `<provider>_id` claim (例 `github_id: "<github-numeric-id>"`) を載せる仕組み
  (`getAdditionalUserInfoClaim` で account テーブルから自動投入) がある
  → sekirei-todo は今と同じ「**tasks.userId に GitHub numeric id を保持**」をそのまま続けられる
- ursa-auth の `.ursa-auth.config.json` には `https://<frontend-domain>` がすでに
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

`honox/` は実験で作って未使用のまま。catalog に乗せた依存の最新化は済んでいるので、
残っているのは「消すか残すか」の判断だけ。

⚠ `honox` の `tsc --noEmit` は依存更新前から 6 件失敗している既知の破損。
未使用なので放置しているが、**静的チェックの判定材料にはしないこと**。

## 構成の経緯メモ

詳細は git log と過去のディスカッションを参照。要点:

- 当初 better-auth は Next.js 側に置こうとしたが、Vercel から VPS の MySQL に到達できないため server-ts に移した
- `api.<root>/sekirei-todo/...` の path-prefix 構成で詰まった (better-auth の router basePath と nginx strip 後の path が一致せず 404)
- 専用サブドメイン (`<api-domain>:8443`) を切って解決
- cookie 共有のため `COOKIE_DOMAIN=.<root-domain>` を設定 (parent domain cookie)
- **その後、単一オリジン化でこれは不要になった。** ブラウザは `https://<frontend-domain>` しか
  叩かず、`/api/*` は Vercel の rewrite 経由で server-ts に届くので、cookie は host-only +
  `SameSite=Lax` で足りる。`COOKIE_DOMAIN` / `CORS_ORIGINS` はコードから参照していない
  （env に残っていても無害だが、消しておくと混乱がない）。
  API ドメイン自体は rewrite の宛先として残っている（ブラウザからは踏まれない）
