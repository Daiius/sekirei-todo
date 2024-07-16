'use client'

import { useActionState } from 'react';
import clsx from 'clsx';

import { authenticate } from '@/actions/authenticate';

import Button from '@/components/Button';
import { ArrowLeftEndOnRectangleIcon } from '@heroicons/react/24/outline';
import SekireiIcon from './SekireiIcon';
import { useSession } from 'next-auth/react';

export default function LoginForm() {
  const [errorMessage, formAction, isPending] = useActionState(
    authenticate,
    undefined,
  );
  const { update } = useSession();

  return (
    <form 
      action={formAction} 
      className={clsx(
        'flex flex-col gap-1 w-[60%] ml-auto mr-auto p-5'
      )}
    >
      <SekireiIcon className='self-center'/>
      <input 
        type='text' 
        name='username' 
        placeholder='User name' 
        required 
        className='p-1 rounded-md'
      />
      <input 
        type='password' 
        name='password' 
        placeholder='Password' 
        required
        className='p-1 rounded-md'
      />
      <Button 
        aria-disabled={isPending}
        className='mt-2 p-2 self-end flex flex-row'
        type='submit'
        onClick={() => update()}
      >
        Login
        <ArrowLeftEndOnRectangleIcon className='size-6 ml-2'/>
      </Button>
      {errorMessage &&
        <div className='text-red-200'>{errorMessage}</div>
      }
    </form>
  );
}

