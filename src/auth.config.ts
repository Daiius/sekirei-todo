import type { NextAuthConfig } from "next-auth";

export const authConfig = {
  debug: true,
  session: { strategy: 'jwt' },
  pages: {
    signIn: '/login',
  },
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const isOnTasks = nextUrl.pathname.startsWith('/tasks')
      if (isOnTasks) {
        return isLoggedIn;
      } else if (isLoggedIn) {
        return Response.redirect(new URL('/tasks', nextUrl));
      }
      return true;
    }
  },
  providers: [],
} satisfies NextAuthConfig;

