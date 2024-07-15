import type { NextAuthConfig } from "next-auth";

export const authConfig = {
  debug: true,
  session: { strategy: 'jwt' },
  pages: {
    signIn: '/login',
  },
  callbacks: {
    async authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const isOnRoot = nextUrl.pathname === '/';
      if (isOnRoot) {
        return isLoggedIn;
      } else if (isLoggedIn) {
        return Response.redirect(new URL('/', nextUrl));
      }
      return true;
    }
  },
  providers: [],
} satisfies NextAuthConfig;

