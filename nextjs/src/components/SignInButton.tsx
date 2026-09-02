'use client'

import React from 'react';
import clsx from 'clsx';

import { authClient } from '@/lib/auth-client';

import { ArrowLeftEndOnRectangleIcon } from '@heroicons/react/24/outline';
import Button from '@/components/Button';

const SignInButton: React.FC<
  React.ComponentProps<typeof Button>
> = ({
  className,
  ...props
}) => (
  <Button
    className={clsx('mt-2 p-2 flex flex-row', className)}
    onClick={async () => {
      // 単一オリジンなので callbackURL は相対パスでよい。
      // better-auth の originCheckMiddleware は callbackURL に対して
      // allowRelativePaths を有効にしており (dist/api/middlewares/origin-check.mjs →
      // trusted-origins.mjs の isSafeRelativeURL)、`/tasks` のような単純な相対パスは
      // trustedOrigins に無くても通る。callback は Location ヘッダにそのまま出るので、
      // ブラウザが自オリジン基準で解決する。
      await authClient.signIn.social({
        provider: 'github',
        callbackURL: '/tasks',
      });
    }}
    {...props}
  >
    Sign-in by Github
    <ArrowLeftEndOnRectangleIcon className='size-6 ml-2'/>
  </Button>
);

export default SignInButton;
