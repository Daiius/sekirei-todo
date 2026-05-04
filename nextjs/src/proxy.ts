import { NextRequest, NextResponse } from 'next/server';
import { getSessionCookie } from 'better-auth/cookies';

export function proxy(request: NextRequest) {
  const sessionCookie = getSessionCookie(request, {
    cookiePrefix: 'sekirei',
  });
  const isLoggedIn = !!sessionCookie;
  const { pathname } = request.nextUrl;
  const isOnRoot = pathname === '/';
  const isOnTasks = pathname === '/tasks';

  if (isLoggedIn) {
    if (!isOnTasks) {
      return NextResponse.redirect(new URL('/tasks', request.nextUrl));
    }
    return NextResponse.next();
  }

  if (!isOnRoot) {
    return NextResponse.redirect(new URL('/', request.nextUrl));
  }
  return NextResponse.next();
}

export const config = {
  matcher: ['/', '/tasks'],
};
