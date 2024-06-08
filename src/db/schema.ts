import {
  binary,
  serial,
  boolean,
  date,
  mysqlTable,
  primaryKey,
  timestamp,
  varchar,
  index,
} from 'drizzle-orm/mysql-core';


export const users = mysqlTable('Users', {
  id:
    varchar('id', { length: 128 })
    .notNull()
    .primaryKey(),
  passWithSalt:
    binary('passWithSalt', { length: 32 })
    .notNull(),
  createdAt:
    timestamp('createdAt')
    .defaultNow(),
});

export const projects = mysqlTable('Projects', {
  id: 
    varchar('id', { length: 256 })
    .unique()
    .notNull(),
  userId: 
    varchar('userId', { length: 128 })
    .notNull()
    .references(() => users.id, {onDelete: 'cascade'}),
  createdAt: 
    timestamp('createdAt')
    .defaultNow(),
}, (table) => ({
    pk: primaryKey({ columns: [table.id, table.userId]})
  }),
);

export const tasks = mysqlTable('Tasks', {
  id:
    serial('id')
    .notNull()
    .primaryKey(),
  userId: 
    varchar('userId', { length: 128 })
    .notNull()
    .references(() => users.id, { onDelete: 'cascade'}),
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
}, (table) => ({
  pk: primaryKey({ columns: [table.id, table.userId] }),
}),
);
