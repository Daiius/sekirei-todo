import React from 'react';
import clsx from 'clsx';


import SekireiIcon from '@/components/SekireiIcon';
import SignInButton from '@/components/SignInButton';

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
      <SignInButton className='self-center' />
    </div>
  );
}


