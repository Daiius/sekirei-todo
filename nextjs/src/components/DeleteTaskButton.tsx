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

const DeleteTaskButton: React.FC<DeleteTaskButtonProps> = ({
  taskId,
  ...props
}: DeleteTaskButtonProps) => {

  const router = useRouter();

  return (
    <Button
      {...props}
      type='submit' 
      className={clsx(
        'border-none flex flex-row gap-3 items-center p-1',
      )}
      onClick={async () => {
        await deleteTask(taskId);
        router.refresh();
      }}
    >
      <TrashIcon className='size-4 stroke-red-500'/>
      Delete task
    </Button>
  );
};

export default DeleteTaskButton;

