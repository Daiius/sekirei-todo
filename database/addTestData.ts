import { tasks, user } from './db/schema';
import { eq } from 'drizzle-orm';

import { drizzle } from 'drizzle-orm/mysql2';
import mysql from 'mysql2/promise';

const client = await mysql.createConnection({
  host: process.env.DB_HOST!,
  user: process.env.MYSQL_USER!,
  password: process.env.MYSQL_PASSWORD!,
  database: process.env.MYSQL_DATABASE!,
});

const db = drizzle({ client });

const testUserId = process.env.TEST_USER_ID ?? 'test-user-001';

await db.insert(user).values([{
  id: testUserId,
  name: 'Test User',
  email: 'test@example.com',
  emailVerified: true,
}]).onDuplicateKeyUpdate({ set: { name: 'Test User' } });

const existingTask = await db
  .select({ id: tasks.id })
  .from(tasks)
  .where(eq(tasks.userId, testUserId))
  .limit(1);

if (existingTask.length === 0) {
  await db.insert(tasks).values([{
    userId: testUserId,
    description: 'this is a test task!',
  }]);
  console.log(`Inserted test task for ${testUserId}`);
} else {
  console.log(`Test data for ${testUserId} already exists, skipping seed`);
}

await client.end();
