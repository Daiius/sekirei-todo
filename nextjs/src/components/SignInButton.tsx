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
      // better-auth は server-ts (別ホスト) にあるため callbackURL は
      // Next.js 側のフルパスを渡す。NEXT_PUBLIC_APP_URL は Next.js のパブリック URL
      await authClient.signIn.social({
        provider: 'github',
        callbackURL: `${process.env.NEXT_PUBLIC_APP_URL}/tasks`,
      });
    }}
    {...props}
  >
    Sign-in by Github
    <ArrowLeftEndOnRectangleIcon className='size-6 ml-2'/>
  </Button>
);

export default SignInButton;
