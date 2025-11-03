import { auth } from '@/auth';
import { NextApiRequest, NextApiResponse } from 'next';

export async function proxy(
  req: NextApiRequest,
  res: NextApiResponse
) {
  console.log('middleware, req: ', req);
  return auth(req, res);
}


export const config = {
  // 変更した場合にはnext.jsコンテナを再起動する必要がありそう
  // (キャッシュされているみたい)
  matcher: ['/', '/tasks'],
};

