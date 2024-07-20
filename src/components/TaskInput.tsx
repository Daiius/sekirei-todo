'use client'

import React from 'react';
import clsx from 'clsx';

import Input from '@/components/Input';
import { addTask } from '@/actions/tasksActions';

import { useRouter } from 'next/navigation';

const TaskInput: React.FC = () => {

  const router = useRouter();

  const [errorMessage, formAction, isPending] = React.useActionState(
    async (prevState: string | undefined, formData: FormData) => {
      const description = formData.get('description')?.toString();
      if (description != null) {
        await addTask({ description });
        router.refresh();
      }
      return "task added!";
    }, 
    undefined,
  );
  return (
    <>
      <form
        action={formAction}
        className={clsx(
          'flex flex-row items-center gap-3 w-64',
          'p-2 border border-1 border-slate-300 rounded-md',
        )}
      >
        <Input
          type='text'
          name='description'
          placeholder='New task...'
          required
          disabled={isPending}
        />
      </form>
      {errorMessage != null &&
        <div className='ms-auto'>{errorMessage}</div>
      }
    </>
  );
};

export default TaskInput;

