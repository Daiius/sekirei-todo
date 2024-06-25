import type { NextAuthConfig } from "next-auth";

export const authConfig = {
  debug: true,
  session: { strategy: 'jwt' },
  pages: {
    signIn: '/login',
  },
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      console.log('auth: ', auth);
      console.log('nextUrl: ', nextUrl);
      const isLoggedIn = !!auth?.user;
      const isOnRoot = nextUrl.pathname === '/';
      if (isOnRoot) {
        if (isLoggedIn) return true;
        return false;
      } else if (isLoggedIn) {
        return Response.redirect(new URL('/', nextUrl));
      }
      return true;
    }
  },
  providers: [],
} satisfies NextAuthConfig;

