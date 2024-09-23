export { auth as middleware } from '@/auth';

export const config = {
  // ここはリバースプロキシ下なので、/sekirei-todo は必要無さそう
  // ↑ 違う！おそらくbasePath: '/sekirei-todo'を指定したため
  //   Next.js がそれを除外してmatcherに渡している
  //
  // 変更した場合にはnext.jsコンテナを再起動する必要がありそう
  // (キャッシュされているみたい)
  matcher: ['/', '/tasks'],
};

