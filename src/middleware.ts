import { auth } from '@/auth';
import { NextRequest, NextResponse } from 'next/server';
import { NextApiRequest, NextApiResponse } from 'next';

export async function middleware(
  req: NextApiRequest,
  res: NextApiResponse
) {
  console.log('middleware, req: ', req);
  return auth(req, res);
}

//export async function middleware(
//  req: NextRequest
//): Promise<Response> {
//  return NextResponse.next();
//}

export const config = {
  // ここはリバースプロキシ下なので、/sekirei-todo は必要無さそう
  // ↑ 違う！おそらくbasePath: '/sekirei-todo'を指定したため
  //   Next.js がそれを除外してmatcherに渡している
  //
  // 変更した場合にはnext.jsコンテナを再起動する必要がありそう
  // (キャッシュされているみたい)
  matcher: ['/', '/tasks'],
};

