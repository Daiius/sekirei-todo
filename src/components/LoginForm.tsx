'use client'

import { useActionState } from 'react';

import { authenticate } from '@/actions/authenticate';
import { Field, Label, Input } from '@headlessui/react';
import Button from '@/components/Button';

export default function LoginForm() {
  const [errorMessage, formAction, isPending] = useActionState(
    authenticate,
    undefined,
  );

  return (
    <form action={formAction}>
      <input type='text' name='username' placeholder='User name' required />
      <input type='password' placeholder='Password' required />
      <Button aria-disabled={isPending}>
        Login
      </Button>
      {errorMessage &&
        <div className='text-red-200'>{errorMessage}</div>
      }
    </form>
  );
}
