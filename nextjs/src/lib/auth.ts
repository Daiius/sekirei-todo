import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { db } from 'database/db';

export const auth = betterAuth({
  appName: 'sekirei-todo',
  database: drizzleAdapter(db, { provider: 'mysql' }),
  socialProviders: {
    github: {
      clientId: process.env.GITHUB_CLIENT_ID!,
      clientSecret: process.env.GITHUB_CLIENT_SECRET!,
    },
  },
  advanced: {
    cookiePrefix: 'sekirei',
  },
});
