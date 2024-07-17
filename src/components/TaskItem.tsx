'use client'

import React from 'react';
import clsx from 'clsx';

import { 
  EllipsisVerticalIcon,
  Bars3Icon,
} from '@heroicons/react/24/outline';
import { useDebouncedCallback } from 'use-debounce';
import Button from '@/components/Button';
import Input from '@/components/Input';

import { mutateTask, type getTasks } from '@/actions/tasksActions';

type ExtractElement<T> = T extends (infer E)[] ? E : never;
type Task = ExtractElement<Awaited<ReturnType<typeof getTasks>>>;

export type TaskItemProps = {
  task: Task;
} & React.ComponentProps<'div'>;

const TaskItem: React.FC<TaskItemProps> = ({ 
  task,
  ...props
}) => {
  const debouncedOnChange = useDebouncedCallback(
    async (value: string) => await mutateTask({
      id: task.id, description: value
    }),
    500
  );

  return (
    <div
      className={clsx(
        'flex flex-row items-center gap-3 w-64',
        'p-2 border border-1 border-slate-300 rounded-md',
        props.className
      )}
      {...props}
    >
      <Bars3Icon className='size-4 cursor-grab' />
      <div className='flex flex-col'>
        <Input
          type='text'
          defaultValue={task.description}
          onChange={e => debouncedOnChange(e.target.value)}
        />
      </div>
      <Button className='ms-auto outline-none border-none'>
        <EllipsisVerticalIcon className='size-4' />
      </Button>
    </div> 
  );
}

export default TaskItem;

