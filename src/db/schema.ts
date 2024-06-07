import {
  binary,
  serial,
  boolean,
  date,
  mysqlSchema,
  primaryKey,
  timestamp,
  varchar,
} from 'drizzle-orm/mysql-core';

export const schema = mysqlSchema(process.env.MYSQL_DATABASE!);

export const users = schema.table('Users', {
  id:
    varchar('id', { length: 128 })
    .notNull()
    .primaryKey(),
  passWithSalt:
    binary('passWIthSalt', { length: 256 })
    .notNull(),
  createdAt:
    timestamp('createdAt')
    .defaultNow(),
});

export const projects = schema.table('Projects', {
  id: 
    varchar('id', { length: 256 })
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

export const tasks = schema.table('Tasks', {
  id:
    serial('id')
    .notNull(),
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

