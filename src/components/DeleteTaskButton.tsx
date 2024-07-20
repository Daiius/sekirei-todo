'use client'

import React from 'react';
import clsx from 'clsx';

import { TrashIcon } from '@heroicons/react/24/outline';

import Button from '@/components/Button';
import { deleteTask } from '@/actions/tasksActions';
import { useRouter } from 'next/navigation';

export type DeleteTaskButtonProps = {
  taskId: number;
} & React.ComponentProps<typeof Button>;

//const DeleteTaskButton: React.FC<DeleteTaskButtonProps> = ({
export default function DeleteTaskButton({
  taskId,
  ...props
}: DeleteTaskButtonProps) {

  const router = useRouter();

  const [_errorMessage, formAction, isPending] = React.useActionState(
    async () => {
      await deleteTask(taskId);
      router.refresh();
    },
    undefined,
  );
  
  return (
    <form action={formAction}>
      <Button
        type='submit' 
        className={clsx(
          'border-none flex flex-row gap-3 items-center p-1',
          props.className
        )}
        disabled={isPending}
        {...props}
      >
        <TrashIcon className='size-4 stroke-red-500'/>
        Delete task
      </Button>
    </form>
  );
};

//export default DeleteTaskButton;

