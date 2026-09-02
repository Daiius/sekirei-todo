// dev / 検証用のシード投入エントリ。**冪等**（何度流しても同じ最終状態に収束し、削除はしない）。
//
//   dev  … pnpm db:seed      → docker compose exec server-ts pnpm --filter database seed
//   本番 … docker compose run --rm --no-deps <server サービス> seed.js
//
// DB 接続は db/index.ts の共有 client（mysql2 の Pool）を使う。migrate.ts と同じ経路。

import { eq } from 'drizzle-orm';
import { randomUUID } from 'node:crypto';

import { client, db } from './db/index';
import { tasks, user, account } from './db/schema';

const testUserId = process.env.TEST_USER_ID ?? 'test-user-001';
const testGitHubId = process.env.TEST_GITHUB_ID || undefined;

// better-auth 1.7 から account の identity は (issuer, accountId) にスコープされる。
// 独自 issuer を持たない OAuth provider には `local:oauth:<providerId>` が入る。
const githubIssuer = 'local:oauth:github';

async function main() {
  // better-auth の user (FK 先) は常に作っておく。
  await db.insert(user).values([{
    id: testUserId,
    name: 'Test User',
    email: 'test@example.com',
    emailVerified: true,
  }]).onDuplicateKeyUpdate({ set: { name: 'Test User' } });

  // TEST_GITHUB_ID があればそれを testUser に紐付ける。GitHub OAuth ログイン時に
  // better-auth が新規 user を作らずこの user を使うので、seed タスクが見える。
  // (issuer, accountId) に unique index があるので upsert がそのまま冪等になる。
  if (testGitHubId) {
    await db.insert(account).values([{
      id: randomUUID(),
      issuer: githubIssuer,
      accountId: testGitHubId,
      providerId: 'github',
      userId: testUserId,
    }]).onDuplicateKeyUpdate({ set: { userId: testUserId, providerId: 'github' } });
    console.log(`Linked GitHub account ${testGitHubId} to ${testUserId}`);
  }

  // tasks.userId は GitHub の numeric id を保持する設計。
  // TEST_GITHUB_ID が無い場合はログインしても所有者が一致しないので、
  // シード用途として testUserId を入れておく (dev で DB を覗くとき用)。
  const ownerId = testGitHubId ?? testUserId;

  // Tasks は自動採番 id しか持たず自然キーが無いので、upsert ではなく
  // 「所有者のタスクが 1 件も無いときだけ入れる」形で冪等にする。
  const existingTask = await db
    .select({ id: tasks.id })
    .from(tasks)
    .where(eq(tasks.userId, ownerId))
    .limit(1);

  if (existingTask.length === 0) {
    await db.insert(tasks).values([{
      userId: ownerId,
      description: 'this is a test task!',
    }]);
    console.log(`Inserted test task for ${ownerId}`);
  } else {
    console.log(`Test data for ${ownerId} already exists, skipping seed`);
  }
}

try {
  await main();
  console.log('seed applied');
  await client.end();
} catch (err) {
  console.error(err instanceof Error ? err.message : String(err));
  await client.end();
  process.exitCode = 1;
}
