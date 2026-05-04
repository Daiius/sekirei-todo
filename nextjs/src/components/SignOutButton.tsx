'use client'

import React from 'react';
import clsx from 'clsx';

import { useRouter } from 'next/navigation';

import { authClient } from '@/lib/auth-client';

import { ArrowRightStartOnRectangleIcon } from '@heroicons/react/24/outline';
import Button from '@/components/Button';

const SignOutButton: React.FC<
  React.ComponentProps<typeof Button>
> = ({
  className,
  ...props
}) => {
  const router = useRouter();
  return (
    <Button
      className={clsx('flex flex-row items-center', className)}
      onClick={async () => {
        await authClient.signOut();
        router.refresh();
      }}
      {...props}
    >
      SignOut
      <ArrowRightStartOnRectangleIcon className='size-6'/>
    </Button>
  );
}

export default SignOutButton;
