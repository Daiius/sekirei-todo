import React from 'react';
import clsx from 'clsx';
import { signOut } from '@/auth';
import Button from '@/components/Button';
import {ArrowRightStartOnRectangleIcon} from '@heroicons/react/24/outline';
import { auth } from '@/auth';

const Header: React.FC = async () => {
  const session = await auth();
  return (
    <div className={clsx(
      'flex flex-row h-[3rem] px-2 items-center',
      'dark:bg-slate-900',
    )}>
      {session?.user &&
        <>
          <div
            className='ms-auto mr-4'
          >
            Welcome: {session.user.name}
          </div>
          <form
            action={async () => {
              'use server'
              await signOut();
            }}
          >
            <Button 
              className='flex flex-row items-center'
              type='submit'
            >
              Logout
              <ArrowRightStartOnRectangleIcon className='size-6'/>
            </Button>
          </form>
        </>
      }
    </div>
  );
}

export default Header;

