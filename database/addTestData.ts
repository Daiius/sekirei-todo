import { tasks } from './db/schema';

import { drizzle } from 'drizzle-orm/mysql2';
import mysql from 'mysql2/promise';

const connection = await mysql.createConnection({
  host: process.env.DB_HOST!,
  user: process.env.MYSQL_USER!,
  password: process.env.MYSQL_PASSWORD!,
  database: process.env.MYSQL_DATABASE!,
});


const db = drizzle(connection);

await db.insert(tasks).values([{
  userId: process.env.TEST_GITHUB_ID!,
  description: 'this is a test task!',
}]);

await connection.end();

