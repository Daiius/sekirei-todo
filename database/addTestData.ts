import { tasks, user, account } from './db/schema';
import { and, eq } from 'drizzle-orm';
import { randomUUID } from 'crypto';

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
const testGitHubId = process.env.TEST_GITHUB_ID;

await db.insert(user).values([{
  id: testUserId,
  name: 'Test User',
  email: 'test@example.com',
  emailVerified: true,
}]).onDuplicateKeyUpdate({ set: { name: 'Test User' } });

// TEST_GITHUB_ID が設定されていれば、その GitHub アカウントを testUser に紐付ける。
// これで GitHub OAuth ログイン時に better-auth が新規 user を作らずこの user を使うので、
// seed したタスクがログイン後にそのまま見える。
if (testGitHubId) {
  const existingAccount = await db
    .select({ id: account.id })
    .from(account)
    .where(and(
      eq(account.providerId, 'github'),
      eq(account.accountId, testGitHubId),
    ))
    .limit(1);

  if (existingAccount.length === 0) {
    await db.insert(account).values([{
      id: randomUUID(),
      accountId: testGitHubId,
      providerId: 'github',
      userId: testUserId,
    }]);
    console.log(`Linked GitHub account ${testGitHubId} to ${testUserId}`);
  }
}

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
