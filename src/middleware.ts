
export { auth as middleware } from '@/auth';


export const config = {
  // ここはリバースプロキシ下なので、/sekirei-todo は必要無さそう
  // 変更した場合にはnext.jsコンテナを再起動する必要がありそう
  // (キャッシュされているみたい)
  matcher: ['/', '/tasks'],
};

