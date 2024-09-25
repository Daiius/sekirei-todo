import React from 'react';
import clsx from 'clsx';

import { auth } from '@/auth';
import SignOutButton from './SignOutButton';

const Header: React.FC = async () => {
  const session = await auth();
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
          <SignOutButton />
        </>
      }
    </div>
  );
}

export default Header;

