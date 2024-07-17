'use client'

import React from 'react';
import clsx from 'clsx';


import Input from '@/components/Input';
import { addTask } from '@/actions/tasksActions';

const TaskInput: React.FC = () => {
  const [errorMessage, formAction, isPending] = React.useActionState(
    async (prevState: string | undefined, formData: FormData) => {
      const description = formData.get('description')?.toString();
      if (description != null) {
        await addTask({ description });
      }
      return "task added!";
    }, 
    undefined,
  );
  return (
    <form
      action={formAction}
      className={clsx(
        'flex flex-row items-center gap-3 w-64',
        'p-2 border border-1 border-slate-300 rounded-md',
      )}
    >
      <Input
        type='submit'
        name='description'
        placeholder='New task...'
        required
      />
    </form>
  );
};

export default TaskInput;

