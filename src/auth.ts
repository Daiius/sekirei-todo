import NextAuth from "next-auth"
import GitHub from "next-auth/providers/github"
 
export const { handlers, auth, signIn, signOut } = NextAuth({
  // docker環境ではtrustHost: trueが必要らしいです
  trustHost: true,
  providers: [GitHub],
  basePath: '/sekirei-todo/api/auth',
  debug: process.env.NODE_ENV !== 'production',
  callbacks: {
    async jwt({ token, account, profile }) {
      if (account && profile) {
        token.sub = profile.id ?? '';
        // emailは空になっている、取得するには
        // GithubのOAuth設定をきちんと変更する必要がありそう
        // (emailを教えてよいとは設定していないと思うので...)
        token.email = profile.email;
        token.username = profile.login;
      }
      return token;
    },
    async session({ session, token }) {
      session.user.id = token.sub ?? '';
      session.user.email = token.email ?? '';
      //session.user.username = token.username ?? '';
      return session;
    },
    async authorized({ auth, request: { nextUrl }}) {
      console.log('authorized, nextUrl: ', nextUrl);
      const isLoggedIn = !!auth?.user;
      // AUTH_URLの有無で/sekirei-todoの有無が変わる...注意したい
      const isOnRoot = nextUrl.pathname === '/sekirei-todo';
      const isOnTasks = nextUrl.pathname === '/sekirei-todo/tasks';

      // ログイン済みならtasksページにリダイレクト、
      // そうでないなら、ルートページならそのまま
      // ログインページならそのまま
      // それ以外はログインページにリダイレクト
      if (isLoggedIn) {
        if (!isOnTasks) {
          return Response.redirect(new URL('/sekirei-todo/tasks', nextUrl));
        }
        return true;
      } else {
        if (!isOnRoot) {
          console.log('is not on root, redirecting...', nextUrl);
          return Response.redirect(new URL('/sekirei-todo', nextUrl));
        }
        return true;
      }
    },
  }
});

