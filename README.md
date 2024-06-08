# Sekirei-Todo
身の回りにセキレイがたくさんいるので、
それをモチーフにしたTo-Do ListをNext.jsで作ります。

実現したい機能は以下です：
- localStorageとClient Componentを適切に使用し、ある程度のオフライン使用に耐える
- セキレイのかわいいアイコンをメインに配置して、リアルに尻尾を振る
- Server Componentも使用し、Client ComponentとのCompositionを試みる
- drizzle orm によるデータベースとのやり取りを行う

## DB設計
- タスクをプロジェクト毎に管理できるようにする
- （他のユーザはいないと思うが）ユーザごとに確実にデータを分ける

```plantuml
hide circle
skinparam linetype ortho
entity Users {
  * id: varchar(128) <<unique username>>
  * passWithSalt: binary(256)
  --
}

entity Projects {
  * id: varchar(256) <<Project name, unique per user>>
  * userId: varchar(128)
}

entity Tasks {
  * id: bigint autoincrement
  * userId: 
}

Users ||--o{ Projects
Users ||--o{ Tasks
Tasks }o--o| Projects
```
- Userから見ると...
  - 関連するTasksは0個かもしれないし、多数かもしれない
  - 関連するProjectsは0個かもしれないし、多数かもしれない
- Tasksから見ると...
  - 関連するUsersはただ1つのみ
  - 関連するProjectsは0個かただ1つのみ
- Projectsから見ると...
  - 関連するUsersはただ1つのみ
  - 関連するTasksは0個かもしれないし、多数かもしれない

...つまり、複数のユーザがタスクやプロジェクトを共有しようとすると、
この設計ではうまくいかないことになる...(が、最初はこれでいいか...)

## DrizzleとDockerとMySQLと...
これまでの開発環境では、MySQL Docker Imageを使っていた

マルチステージビルドとしてDB設定関連のファイルを先に生成して、
実行用のイメージに移すことで起動時間を短縮するものも使った

現在は...
- 素のMySQLコンテナを生成
- 開発環境用のNext.jsコンテナを生成
- 開発環境用のNext.jsコンテナからDrizzleを実行し、MySQLコンテナにSchemaに沿ったDBを生成

という順番で行っているが、いくつか問題がありそう
1. テスト用のデータを追加するために/docker-entrypoint-initdb.dに
ファイルを追加する方法が上手くいかない
2. drizzle-kit push を使う場合にはすでにDBにデータがある場合失敗する

...なので、感覚としては
- マイグレーションのためだけのコンテナを用意し、
MySQLデータベースにマイグレーションとテストデータ投入を行う
- 開発環境起動時にはそこで得られたデータベース内容を元に起動する

...といったことをしたい
npmのmonorepo機能、workspaceが使える？試してみるか...

