import NextAuth, { User } from "next-auth";
import Credentials from 'next-auth/providers/credentials';
import { authConfig } from './auth.config';
import { z } from 'zod';
import { hashWithSalt } from '@/lib/crypto';

import { getUser } from '@/actions/userActions';


export const { handlers: { GET, POST}, signIn, signOut, auth } = NextAuth({
  ...authConfig,
  trustHost: true,
  providers: [
    Credentials({
      credentials: {
        username: {},
        password: {},
      },
      async authorize(credentials): Promise<User|null> {
        'use server'

        console.log('authorize()');
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
        if (passwordsMatch) return { name: username };
        return null;
      },
    })
  ],
});

