import NextAuth, { User } from "next-auth";
import Credentials from 'next-auth/providers/credentials';
import { authConfig } from './auth.config';
import { z } from 'zod';
import {db} from "@/db";
import { eq } from 'drizzle-orm';
import {users} from "@/db/schema";
import { hashWithSalt } from '@/lib/crypto';


declare module 'next-auth' {
  interface User {
    username: string;
    passWithSalt: string;
  }
}

async function getUser(email: string): Promise<User|undefined> {
  try {
    const user = await db.select().from(users).where(eq(users.id, email));
    return { username: user[0].id, passWithSalt: user[0].passWithSalt };
  } catch (error) {
    console.error('Failed to fetch user:', error);
    throw new Error('Failed to fetch user.');
  }
}

export const { handlers, signIn, signOut, auth } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      credentials: {
        username: {},
        password: {},
      },
      async authorize(credentials) {
        const parsedCredentials = z
          .object({ username: z.string(), password: z.string() })
          .safeParse(credentials);
        if (parsedCredentials.success) {
          const { username, password } = parsedCredentials.data;
          const hashedPassword = await hashWithSalt(password, process.env.HASH_SALT!);
          const user = await getUser(username);
          if (!user) return null;
          const passwordsMatch = (hashedPassword === user.passWithSalt);
          if (passwordsMatch) return user;
        }
        return null;
      },
    })
  ],
});

