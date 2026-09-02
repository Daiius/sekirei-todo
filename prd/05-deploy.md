# 05. デプロイと本番運用

> 🚧 **未記述（骨組みのみ）。** 中身は次のセッションで実装から起こす。
> 現時点の記述は [`../AGENTS.md`](../AGENTS.md) の「本番デプロイ」節にある。

本章は本番構成とデプロイ経路を定める。**姿勢のみ**を書き、実ドメイン・接続先・資格情報は書かない
（→ [README.md](./README.md) §公開リポジトリでの秘匿方針）。実値と運用手順は `.claude/local/`。

## 書くこと

- **本番も dev と同じ単一オリジン**であること（[01](./01-architecture.md)）。
  Next.js は Vercel、server-ts は VPS 上の container、MySQL は VPS。
- **Vercel に置く env**: `API_URL`（rewrite の宛先兼サーバ側 fetch 先・絶対 URL 必須）。
  `NEXT_PUBLIC_*` が不要になった経緯。⚠ `rewrites()` は build 時評価なので変更には redeploy が要る。
- **VPS に置く env**: `BETTER_AUTH_URL`（⚠ 公開オリジン。API ドメインではない）/ `TRUSTED_ORIGINS` /
  秘密 3 種 / 廃止済みの `COOKIE_DOMAIN` `CORS_ORIGINS`。**値は書かず変数名と役割のみ**。
- **デプロイ手順**: Next.js は `main` の自動デプロイ。server-ts は ghcr.io へ push → VPS で pull
  （macOS ホストからは `--platform=linux/amd64` 必須）。
- **本番マイグレーション**: migrate / seed をイメージに同梱し、使い捨てコンテナとして明示実行する
  （適用する SQL とコードのバージョンが構造的に一致する）。**起動時の自動適用はしない**理由。
  ⚠ distroless は `ENTRYPOINT` が暗黙に `node` なので渡すのはパスだけ。
  ⚠ 先に `pnpm db:generate` の生成物を commit し、その commit からビルドしたイメージを push すること。
- ⚠ **本番 DB への初回適用はベースライン化が必要**（[03](./03-data-model.md)）。
  手順とスクリプトはリポジトリに置かず `.claude/local/` を参照する、という姿勢だけを書く。
- **未確認 / 要確認**: 本番動作確認のチェックリスト（本番運用に関わるため `.claude/local/` 側）、
  VPS への直アクセス対策を入れていない旨のユーザー判断。
