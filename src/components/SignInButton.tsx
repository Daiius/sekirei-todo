'use client'

import React from 'react';
import clsx from 'clsx';

import { signIn } from '@/actions/authenticate';

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
    onClick={async () => await signIn('github', { 
      redirectTo: '/tasks', redirect: true 
    })}
    {...props}
  >
    Sign-in by Github
    <ArrowLeftEndOnRectangleIcon className='size-6 ml-2'/>
  </Button>
);

export default SignInButton;

