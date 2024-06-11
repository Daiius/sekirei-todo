import { db } from './db';
import { users, tasks } from './db/schema';

import { hashWithSalt } from './crypto';

await db.insert(users).values([
  { 
    id: 'tester', 
    passWithSalt: 
      await hashWithSalt('password', process.env.HASH_SALT!),
  }
]);

await db.insert(tasks).values([
  {
    userId: 'tester',
    description: 'this is a test task!',
  }
]);

