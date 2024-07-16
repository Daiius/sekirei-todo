import { drizzle } from 'drizzle-orm/mysql2';
import mysql from 'mysql2/promise';


//
// ts-jestを使うなら、top level awaitがどうのというエラーが出るので
// PoolConnectionを使った方が良いのだが...
// Next.js + auth.jsのmiddleware, authenticate関数などを使うと
// なぜかnext build && next start時だけ
// PoolConnection is not a constructorエラーになってしまう...
// ので、createConnectionにしておく
// (MiddlewareのRuntimeがEdge runtimeになるせい？)
//
//export const connection = mysql.createPool({
export const connection = await mysql.createConnection({
  host: process.env.DB_HOST!,
  user: process.env.MYSQL_USER!,
  password: process.env.MYSQL_PASSWORD!,
  database: process.env.MYSQL_DATABASE!,
});

export const db = drizzle(connection);

