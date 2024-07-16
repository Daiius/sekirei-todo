'use client'

import React from 'react';
import clsx from 'clsx';

import { signOut, useSession } from 'next-auth/react';

import Button from '@/components/Button';
import { ArrowRightStartOnRectangleIcon } from '@heroicons/react/24/outline';

const Header: React.FC = () => {
  const { data: session } = useSession();
  console.log('Header rendered!');
  return (
    <div className={clsx(
      'flex flex-row h-[3rem] px-2 items-center',
      'dark:bg-slate-900',
    )}>
      {session?.user &&
        <>
          <div className='ms-auto mr-4'>
            Welcome: {session.user.name}
          </div>
          <Button 
            className='flex flex-row items-center'
            onClick={async () => await signOut()}
          >
            Logout
            <ArrowRightStartOnRectangleIcon className='size-6'/>
          </Button>
        </>
      }
    </div>
  );
}

export default Header;

