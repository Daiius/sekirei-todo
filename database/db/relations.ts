import { defineRelations } from 'drizzle-orm';
import { tasks, projects } from './schema';
import { user, session, account } from './auth-schema';

export const relations = defineRelations(
  { user, session, account, tasks, projects },
  (r) => ({
    user: {
      sessions: r.many.session(),
      accounts: r.many.account(),
      tasks: r.many.tasks(),
      projects: r.many.projects(),
    },
    session: {
      user: r.one.user({
        from: r.session.userId,
        to: r.user.id,
      }),
    },
    account: {
      user: r.one.user({
        from: r.account.userId,
        to: r.user.id,
      }),
    },
    tasks: {
      user: r.one.user({
        from: r.tasks.userId,
        to: r.user.id,
        optional: false,
      }),
      project: r.one.projects({
        from: r.tasks.projectId,
        to: r.projects.id,
      }),
    },
    projects: {
      user: r.one.user({
        from: r.projects.userId,
        to: r.user.id,
        optional: false,
      }),
      tasks: r.many.tasks(),
    },
  }),
);
