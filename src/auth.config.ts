import type { NextAuthConfig } from "next-auth";

export const authConfig = {
  trustHost: true,
  session: { strategy: 'jwt' },
  pages: {
    // ?? 本番環境ではどうするべきか？
    // これは/sekirei-todo/login とするとエラーになる
    signIn: '/login',
  },
  callbacks: {
    async authorized({ auth, request: { nextUrl } }) {
      console.log('authorized()');
      const isLoggedIn = !!auth?.user;
      const isOnRoot = nextUrl.pathname === '/';
      if (isOnRoot) {
        // 未ログインならログインページへ
        // ...trueならそのまま通して、
        // falseならログインページを表示する感じ？
        return isLoggedIn;
      } else if (isLoggedIn) {
        // ログイン済みなのにルートページにいない場合には
        // リダイレクトする
        return Response.redirect(new URL('/sekirei-todo', nextUrl));
      }
      return true;
    }
  },
  providers: [],
} satisfies NextAuthConfig;

