import clsx from 'clsx';
import Button from '@/components/Button';
import { auth, signOut } from '@/auth';

import { ArrowRightStartOnRectangleIcon } from '@heroicons/react/24/outline';


export const dynamic = 'force-dynamic';

export default async function Page() {
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
          <form action={async () => {
            'use server'
            await signOut();
          }}>
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

