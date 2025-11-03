'use client'

import { useActionState } from 'react';

import Input from '@/components/Input';
import { addTask } from '@/actions/tasksActions';

import { useRouter } from 'next/navigation';

export const TaskInput: React.FC = () => {

  const router = useRouter();

  const [errorMessage, formAction, isPending] = useActionState(
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
        className='flex flex-row items-center gap-3 p-2 border border-slate-300 rounded-md'
      >
        <Input
          type='text'
          name='description'
          placeholder='New task...'
          required
          disabled={isPending}
          autoFocus
          autoComplete='off'
        />
      </form>
      {errorMessage != null &&
        <div className='ms-auto'>{errorMessage}</div>
      }
    </>
  );
};
