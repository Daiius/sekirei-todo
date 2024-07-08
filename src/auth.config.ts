import type { NextAuthConfig } from "next-auth";

export const authConfig = {
  debug: true,
  //session: { strategy: 'jwt' },
  pages: {
    signIn: '/login',
  },
  callbacks: {
    async authorized({ auth, request: { nextUrl } }) {
      console.log('authorized(), auth: ', auth);
      const isLoggedIn = !!auth?.user;
      const isOnRoot = nextUrl.pathname === '/';
      if (isOnRoot) {
        console.log('isOnRoot, isLoggedIn: ', isLoggedIn);
        return isLoggedIn;
      } else if (isLoggedIn) {
        console.log('not isOnRoot, redirecting...');
        return Response.redirect(new URL('/', nextUrl));
      }
      return true;
    }
  },
  providers: [],
} satisfies NextAuthConfig;

