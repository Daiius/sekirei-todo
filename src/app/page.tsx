import React from 'react';
import clsx from 'clsx';

import Link from 'next/link';
import { ArrowLeftEndOnRectangleIcon } from '@heroicons/react/24/outline';

import SekireiIcon from '@/components/SekireiIcon';
import Button from '@/components/Button';
import { signIn } from '@/auth';

export default function Page() {
  return (
    <div className='self-center flex flex-col'>
      <SekireiIcon className='self-center my-2'/>
      <div className='self-center flex flex-col items-center'>
        <span> Sekirei Todoは、シンプルなTodoアプリです </span>
        <span> Githubアカウントで認証を行って使用できます </span>
        <div className='my-2'/>
        <span>Sekirei Todo is a simple to-do list with a cute tail-swagger.</span>
        <span>You can login to manage tasks by your Github account!</span>
      </div>
      <form
        action={async () => {
          'use server'
          await signIn('github');
        }}
        className='self-center'
      >
        <Button 
          className='mt-2 p-2 flex flex-row'
          type='submit'
        >
          Sign-in by Github
          <ArrowLeftEndOnRectangleIcon className='size-6 ml-2'/>
        </Button>
      </form>
    </div>
  );
}


