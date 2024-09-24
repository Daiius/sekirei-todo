'use server'

import { 
  signIn as authSignIn, 
  signOut as authSignOut
} from '@/auth';

export const signIn = async (
  params?: Parameters<typeof authSignIn>[0],
) => await authSignIn(params);

export const signOut = async (
  params?: Parameters<typeof authSignOut>[0],
) => await authSignOut(params);

