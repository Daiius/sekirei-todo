'use client'

import React from 'react';

import { signOut } from '@/actions/authenticate';
import { useRouter } from 'next/navigation';

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
      className='flex flex-row items-center'
      onClick={async () =>{
        await signOut();
        router.refresh();
      }}
      {...props}
    >
      サインアウト
      <ArrowRightStartOnRectangleIcon className='size-6'/>
    </Button>
  );
};

export default SignOutButton;

