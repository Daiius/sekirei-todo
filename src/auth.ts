import NextAuth, { DefaultSession, User } from "next-auth";
import Credentials from 'next-auth/providers/credentials';
import { authConfig } from './auth.config';
import { z } from 'zod';
import {db} from "@/db";
import { eq } from 'drizzle-orm';
import {users} from "@/db/schema";
import { hashWithSalt } from '@/lib/crypto';


async function getUser(email: string): Promise<{
  username: string;
   passWithSalt: string;
} |undefined> {
  try {
    const user = await db.select().from(users).where(eq(users.id, email));
    console.log('getUser(), user: ', user[0]);
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
      async authorize(credentials): Promise<User|null> {
        const parsedCredentials = z
          .object({ username: z.string(), password: z.string() })
          .safeParse(credentials);

        if (!parsedCredentials.success)
          throw Error('Invalid credentials format.');

        const { username, password } = parsedCredentials.data;
        const hashedPassword = await hashWithSalt(
          password, process.env.HASH_SALT!
        );
        const user = await getUser(username);
        if (!user) return null;
        
        const passwordsMatch = (
          hashedPassword === user.passWithSalt
        );
        console.log(
          'authorize(), passwordsMatched: ', passwordsMatch
        );
        if (passwordsMatch) return { name: username };
        return null;
      },
    })
  ],
});

