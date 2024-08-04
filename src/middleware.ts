
export { auth as middleware } from '@/auth';


export const config = {
  // 注意！
  // ログイン済みの場合に/loginにアクセスすると
  // ルートURLに飛ばす様にmiddlewareを設定しているが、
  // /loginがmatcher対象外になるとそれができなくなります！
  //
  // ここはリバースプロキシ下なので、/sekirei-todo は必要無さそう
  // 変更した場合にはnext.jsコンテナを再起動する必要がありそう
  // (キャッシュされているみたい)
  matcher: ['/', '/tasks'],
};

