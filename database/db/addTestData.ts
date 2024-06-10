import { db } from '@/db';
import {
  users, tasks, projects
} from '@/db/schema';

import { hashWithSalt } from '@/lib/crypto';

await db.insert(users).values([
  {
    id: 'developer', 
    passWithSalt:
      await hashWithSalt('developer', process.env.HASH_SALT!),
  }
]);

await db.insert(tasks).values([
]);

