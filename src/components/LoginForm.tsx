'use client'

import { useActionState } from 'react';

import { authenticate } from '@/actions/authenticate';

export default function LoginForm() {
  const [errorMessage, formAction, isPending] = useActionState(
    authenticate,
    undefined,
  );

  return (
    <form action={formAction} className='flex flex-col gap-1 w-[60%] self-center p-5'>
      <input type='text' name='username' placeholder='User name' required />
      <input type='password' name='password' placeholder='Password' required />
      <button aria-disabled={isPending}>
        Login
      </button>
      {errorMessage &&
        <div className='text-red-200'>{errorMessage}</div>
      }
    </form>
  );
}

