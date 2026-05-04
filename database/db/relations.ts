import { defineRelations } from 'drizzle-orm';
import { tasks, projects } from './schema';
import { user, session, account } from './auth-schema';

// tasks / projects の userId は user.id ではなく account.accountId (GitHub numeric id) を
// 指すので、user との relation は張らない (drizzle relations は単純等価結合しか表現できないため)。
export const relations = defineRelations(
  { user, session, account, tasks, projects },
  (r) => ({
    user: {
      sessions: r.many.session(),
      accounts: r.many.account(),
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
      project: r.one.projects({
        from: r.tasks.projectId,
        to: r.projects.id,
      }),
    },
    projects: {
      tasks: r.many.tasks(),
    },
  }),
);
