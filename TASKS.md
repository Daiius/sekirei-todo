# 次に行う作業

last updated: 2026-09-03

## 本番リリース（単一オリジン化）— 完了

2026-09-03 に本番へ反映済み。PR #57 を squash マージし、Vercel / VPS / 本番 DB とも
新構成で稼働している。以降の作業は下の「リリース後の宿題」を参照。

作業の記録:

- 本番 DB を**ベースライン化**（`__drizzle_migrations` に init を適用済みとして記録し、
  既存の `Projects` / `Tasks` は FK と列型だけを init に合わせた）
- server-ts イメージを ghcr.io へ push（`:latest` と `:<short sha>` の 2 タグ）
- VPS の env を更新（`BETTER_AUTH_URL` / `TRUSTED_ORIGINS` を公開オリジンへ、
  `COOKIE_DOMAIN` と `CORS_ORIGINS` を削除）して `up -d --force-recreate`
- GitHub App に公開オリジンの callback URL を追加

### ⚠ 移行で踏んだ落とし穴（次に似た移行をするとき用）

- **ベースライン化スクリプトは認証テーブルを「無ければ作る」だけで、旧形式で既に
  存在するテーブルは素通りする。** 本番の `account` が better-auth 1.7 より前の形
  （`issuer` 列が無く `account_id` が `text`）で残っており、テーブルの存在確認だけでは
  気づけなかった。`SHOW CREATE TABLE` まで見て init と突き合わせること。
  1.7 は account の identity を `(issuer, accountId)` にスコープするので、この列と
  複合 unique index が無いとログイン時に落ちる。
- **GitHub App が 2 つあり、VPS の `GITHUB_CLIENT_ID` は callback URL を追加した方とは
  別の App を指していた。** GitHub は「その client_id にこの redirect_uri は紐づいていない」
  という同じ文言を App 取り違えのときにも出すので、URL のスペルを疑う前に
  **App の General ページに出ている Client ID と、実際に送信されている `client_id` を
  突き合わせる**のが早い。
- ghcr.io のリポジトリ名は**小文字必須**（`ghcr.io/daiius/...`）。

## リリース後の宿題

### 1. GitHub App の役割を分ける

本番用 App と開発用 App が別々に存在しているので、役割を確定させる。

🔒 **本番用 App の callback URL から `http://localhost:3000/...` を外すこと。**
localhost は誰のマシンでも同じ URL なので、本番の資格情報に紐づいていると、
攻撃者が手元で listener を立てて `redirect_uri=http://localhost:3000/...` を指定した
認可 URL を踏ませるだけで**本番 App の認可コードを受け取れる**。
ローカル dev / リモート dev の callback は開発用 App 側に寄せる。

- OAuth App / GitHub App のどちらも callback URL は **10 件まで**登録できる
  （「1 件しか登録できないから環境ごとに分ける」ではなく、上記のセキュリティ上の理由で分ける）
- ⚠ **2026-08-03 以降に作成された App は `redirect_uri` の完全一致が既定**。
  それ以前の App は wildcard matching が有効でサブディレクトリ / サブドメインが通るので、
  古い App の感覚で新しい App を作ると弾かれる
- OAuth App への統一は不要。GitHub 自身が GitHub Apps を推奨している
  （fine-grained permissions・短命トークン）

### 2. `Tasks` の重複 FK を削除

`projectId` → `Projects.id` の FK が 2 本ある。`drizzle-kit push` 時代の
`Tasks_projectId_Projects_id_fk` と、ベースライン化が init の名前で追加した
`Tasks_projectId_Projects_id_fkey`。動作上は無害だが余分な index を 1 本持つ。

```sql
ALTER TABLE `Tasks` DROP FOREIGN KEY `Tasks_projectId_Projects_id_fk`;
```

⚠ FK を落としても drizzle が張った index が残ることがあるので、実行後に
`SHOW CREATE TABLE Tasks` で確認する。

### 3. 本番 MySQL の認証と bind アドレスを確認

ベースライン化の作業中、MariaDB クライアントが
`--ssl-verify-server-cert is disabled, because of an insecure passwordless login`
と警告した。**接続が passwordless と判定されている**という意味なので、
`root` の TCP 認証と 3306 の bind アドレスを確認する。SSH トンネル越しなので
即座に危険ではないが、3306 が外部から到達可能なら対処が要る。


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
