import NextAuth from "next-auth";
import { authConfig } from './auth.config';

export default NextAuth(authConfig).auth;

export const config = {
  // 注意！
  // ログイン済みの場合に/loginにアクセスすると
  // ルートURLに飛ばす様にmiddlewareを設定しているが、
  // /loginがmatcher対象外になるとそれができなくなります！
  matcher: ['/', '/login'],
  //matcher:[ '/((?!api|_next/static|_next/image|favicon.ico).*)'] 
};

