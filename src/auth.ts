import NextAuth, { User } from "next-auth";
import Credentials from 'next-auth/providers/credentials';
import { authConfig } from '../auth.config';

declare module 'next-auth' {
  interface User {
    username: string;
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
      authorize: async (credentials) => {
        if (credentials.username == null) return null;
        return { username: credentials.username } as User;
      },
    })
  ],
});

