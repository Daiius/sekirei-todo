
import clsx from 'clsx';

import { signIn } from '@/auth';

import Button from '@/components/Button';
import { ArrowLeftEndOnRectangleIcon } from '@heroicons/react/24/outline';
import { SekireiIcon } from './SekireiIcon';

export default function LoginForm() {

  return (
    <form 
      action={async () => {
        'use server'
        await signIn('github');
      }} 
      className={clsx(
        'flex flex-col gap-1 w-[60%] ml-auto mr-auto p-5'
      )}
    >
      <SekireiIcon className='self-center'/>
      <Button 
        className='mt-2 p-2 flex flex-row'
        type='submit'
      >
        SignIn
        <ArrowLeftEndOnRectangleIcon className='size-6 ml-2'/>
      </Button>
    </form>
  );
}

