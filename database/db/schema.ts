import {
  serial,
  boolean,
  mysqlTable,
  primaryKey,
  timestamp,
  varchar,
} from 'drizzle-orm/mysql-core';

// tasks.userId / projects.userId は better-auth の user.id (UUID) ではなく、
// `account.accountId` (GitHub の numeric id, providerId='github') を保持する。
// 旧 next-auth 時代のデータ (numeric id) をそのまま継承するため。
// FK は張らない: account.accountId は UNIQUE ではなく、別 provider との混在も
// あり得るため。アプリ層で session → account 経由に解決する。

export const projects = mysqlTable(
  'Projects',
  {
    id:
      varchar('id', { length: 256 })
      .unique()
      .notNull(),
    userId:
      varchar('userId', { length: 36 })
      .notNull(),
    createdAt:
      timestamp('createdAt')
      .defaultNow(),
  },
  (table) => [
    primaryKey({ columns: [table.id, table.userId] }),
  ],
);


export const tasks = mysqlTable(
  'Tasks', {
    id:
      serial('id')
      .notNull().primaryKey(),
    userId:
      varchar('userId', { length: 36 })
      .notNull(),
    projectId:
      varchar('projectId', { length: 256 })
      .references(() => projects.id),
    description:
      varchar('content', { length: 512 })
      .notNull(),
    createdAt:
      timestamp('createdAt')
      .defaultNow(),
    done:
      boolean('done')
      .notNull()
      .default(false),
  },
  (table) => [
    primaryKey({ columns: [table.id, table.userId] }),
  ],
);

export * from './auth-schema';
