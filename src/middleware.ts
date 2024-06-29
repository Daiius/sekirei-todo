import NextAuth from "next-auth";
import { authConfig } from './auth.config';

export default NextAuth(authConfig).auth;

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|sekirei_body_fill|sekirei_tail_fill).*)'],
  
  
  //matcher: ['/((?!api|_next/static|_next/image|.*\\.png$).*)'],
  //matcher: ['/', '/((?!api|_next/static|_next/image|.*\\.(png|jpg|jpeg|gif|svg|ico|webp|avif|bmp|tiff|tif)$).*)'],
  //matcher: '/*',
};

