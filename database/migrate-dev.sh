#!/bin/bash

# どうやらdocker exec に渡すコマンド内で、
# コンテナ内の環境変数にアクセスする方法が無さそうなので
# 自力でスクリプト内で使用するようにする
envpath=../.env
if [ -f $envpath ]; then
  export $(grep -v "^#" $envpath | xargs)
fi

# マイグレーションの実行
docker compose -f docker-compose-migration.yml \
  up --build --exit-code-from sekirei-todo-migration

echo "Migration done!"

# DBコンテナのみの再起動
# 本当はmigrationコンテナの終了のみを待って
# DBコンテナは立てっぱなしにできたらうれしい
# 注. --waitオプションは重要、これがないと接続できない旨のエラーが出る
docker compose -f docker-compose-migration.yml \
  up -d sekirei-todo-database --wait

echo "RestartedDB container!"

# テストデータの追記
docker compose -f docker-compose-migration.yml \
  exec -t sekirei-todo-database \
  mysql -u $MYSQL_USER -p$MYSQL_PASSWORD $MYSQL_DATABASE \
  < initdb/*.sql
echo Added test data!

# ダンプの作成
docker compose -f docker-compose-migration.yml \
  exec -t sekirei-todo-database \
  mysqldump -u root -p$MYSQL_ROOT_PASSWORD \
  --complete-insert $MYSQL_DATABASE \
  | gzip > test_dump.sql.gz

echo Create dump done!

## テーブルの確認
#docker compose -f docker-compose-migration.yml \
#  exec -t sekirei-todo-database \
#  mysql -u $MYSQL_USER -p$MYSQL_PASSWORD $MYSQL_DATABASE -e show tables;

# コンテナを終了、破棄
docker compose -f docker-compose-migration.yml down

echo Done!

