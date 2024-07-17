import React from 'react';
import clsx from 'clsx';

import { signOut, auth } from '@/auth';

import Button from '@/components/Button';
import { ArrowRightStartOnRectangleIcon } from '@heroicons/react/24/outline';

const Header: React.FC = async () => {
  const session = await auth();
  return (
    <div className={clsx(
      'flex flex-row h-[3rem] px-2 items-center',
      'dark:bg-slate-900',
    )}>
      {session?.user &&
        <form
          action={async () => {
            'use server'
            await signOut();
          }}
          className='ms-auto flex flex-row items-center'
        >
          <div className='ms-auto mr-4'>
            Welcome: {session.user.name}
          </div>
          <Button 
            className='flex flex-row items-center'
            type='submit'
          >
            Logout
            <ArrowRightStartOnRectangleIcon className='size-6'/>
          </Button>
        </form>
      }
    </div>
  );
}

export default Header;

