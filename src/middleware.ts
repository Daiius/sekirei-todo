
import NextAuth from 'next-auth';
import { auth } from './auth';
import { NextResponse } from 'next/server';
import { authConfig } from './auth.config';

export default NextAuth(authConfig).auth;

//export default auth((req) => {
////  return NextResponse.next();
//
//  const forwardedHost = req.headers.get('X-Forwarded-Host');
//  console.log('middleware, nextUrl: ', req.nextUrl);
//  console.log('forwardedHost: ', forwardedHost);
//  console.log('req.auth: ', req.auth);
//
//  if (!req.auth) {
//    // login reqired...
//    return NextResponse.redirect('http://localhost/sekirei-todo/login');
//  } else {
//    return NextResponse.redirect('http://localhost/sekirei-todo');
//  } 
//  //else {
//  //  // already logged in...
//  //  if (forwardedHost != null) {
//  //    const requestedUrl = req.nextUrl.clone();
//  //    const basePath = '/sekirei-todo';
//
//  //    if (requestedUrl.toString().indexOf(basePath) == -1) {
//  //      const pathForward = 
//  //        basePath 
//  //        + requestedUrl.toString().split('localhost:3000').pop();
//  //      return NextResponse.rewrite(new URL(pathForward, req.url));
//  //    }
//  //  }
//  //  return NextResponse.next();
//  //}
//});


export const config = {
  // 注意！
  // ログイン済みの場合に/loginにアクセスすると
  // ルートURLに飛ばす様にmiddlewareを設定しているが、
  // /loginがmatcher対象外になるとそれができなくなります！
  //
  // ここはリバースプロキシ下なので、/sekirei-todo は必要無さそう
  // 変更した場合にはnext.jsコンテナを再起動する必要がありそう
  matcher: ['/', '/login'],
  //matcher: ['/sekirei-todo', '/sekirei-todo/login'],
};

