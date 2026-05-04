import { Suspense } from 'react';

import { getSession } from '@/lib/auth';
import SignOutButton from '@/components/SignOutButton';

export const Header = async () => {
  return (
    <div className='flex flex-row h-12 px-2 items-center dark:bg-slate-900'>
      <Suspense>
        <HeaderStatus />
      </Suspense>
    </div>
  );
}

const HeaderStatus = async () => {
  'use cache: private'
  const session = await getSession();
  return session?.user
    ? <>
        <div className='ms-auto mr-4'>
          Welcome: {session.user.name}
        </div>
        <SignOutButton />
      </>
    : null
}
