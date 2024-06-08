#!/bin/bash

# マイグレーションの実行
docker compose -f docker-compose-migration.yml \
  --env-file ../.env \
  up --build --exit-code-from sekirei-todo-migration

echo "Migration done!"

# DBコンテナのみの再起動
# 本当はmigrationコンテナの終了のみを待って
# DBコンテナは立てっぱなしにできたらうれしい
docker compose -f docker-compose-migration.yml \
  --env-file ../.env \
  up -d sekirei-todo-database

echo "Restarting DB container..."

# テストデータの追記
#docker compose -f docker-compose-migration.yml \
#  --env-file ../.env \
#  exec -t sekirei-todo-database \
#  mysql -u $$MYSQL_USER -p$$MYSQL_PASSWORD $$MYSQL_DATABASE 
#  #\
#  #< initdb/*.sql

# ダンプの作成
docker compose -f docker-compose-migration.yml \
  --env-file ../.env \
  exec -t sekirei-todo-database \
  mysqldump -u $$MYSQL_USER -p$$MYSQL_PASSWORD \
  --complete-insert --databases $$MYSQL_DATABASE
# \
#  | gzip > test_dump.sql.gz

echo Create dump done!

# テーブルの確認
docker compose -f docker-compose-migration.yml \
  --env-file ../.env \
  exec -t sekirei-todo-database \
  mysql -u $$MYSQL_USER -p$$MYSQL_PASSWORD -e show tables;

# コンテナを終了、破棄
docker compose -f docker-compose-migration.yml down

echo Done!

