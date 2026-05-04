import {
  serial,
  boolean,
  mysqlTable,
  primaryKey,
  timestamp,
  varchar,
} from 'drizzle-orm/mysql-core';

import { user } from './auth-schema';

export const projects = mysqlTable(
  'Projects',
  {
    id:
      varchar('id', { length: 256 })
      .unique()
      .notNull(),
    userId:
      varchar('userId', { length: 36 })
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
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
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
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
