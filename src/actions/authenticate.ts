'use server'

import { signIn as authSignIn, signOut as authSignOut} from '@/auth';

/** auth.js signIn 関数をserver actionとするためのwrapper関数 */
export const signIn = (
  ...params: Parameters<typeof authSignIn>
): ReturnType<typeof authSignIn> => authSignIn(...params);

/** auth.js signOut 関数をserver actionとするためのwrapper関数 */
export const signOut = (
  ...params: Parameters<typeof authSignOut>
): ReturnType<typeof authSignOut> => authSignOut(...params);

/*
 * export { signIn, signOut } from '@/auth' は、
 * 'use server'が書かれた.tsファイルからはasync functionsしか
 * エクスポートできないというエラーになる...
 */
