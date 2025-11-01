import NextAuth from "next-auth"
import GitHub from "next-auth/providers/github"
 
export const { handlers, auth, signIn, signOut } = NextAuth({
  // Docker環境やリバースプロキシ下ではtrustHost: trueが必要になりそうです
  trustHost: true,
  providers: [GitHub],
  //basePath: '/api/auth',
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
      session.user.id = String(token.sub ?? ''); // 文字列を想定していたが実際はnumberらしい？？
      session.user.email = token.email ?? '';
      //session.user.username = token.username ?? '';
      return session;
    },
    async authorized({ auth, request: { nextUrl }}) {
      console.log('authorized, nextUrl: ', nextUrl);
      const isLoggedIn = !!auth?.user;
      const isOnRoot = nextUrl.pathname === '/';
      const isOnTasks = nextUrl.pathname === '/tasks';

      // ログイン済みならtasksページにリダイレクト、
      // そうでないなら、ルートページならそのまま
      // ログインページならそのまま
      // それ以外はログインページにリダイレクト
      if (isLoggedIn) {
        if (!isOnTasks) {
          return Response.redirect(new URL('/tasks', nextUrl));
        }
        return true;
      } else {
        if (!isOnRoot) {
          console.log('is not on root, redirecting...', nextUrl);
          return Response.redirect(new URL('/', nextUrl));
        }
        return true;
      }
    },
  }
});

