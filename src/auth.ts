import NextAuth from "next-auth"
import GitHub from "next-auth/providers/github"
 
export const { handlers, auth, signIn, signOut } = NextAuth({
  trustHost: true,
  providers: [GitHub],
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
      const isLoggedIn = !!auth?.user;
      const isOnRoot = nextUrl.pathname === '/sekirei-todo';
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
    },
  }
});

