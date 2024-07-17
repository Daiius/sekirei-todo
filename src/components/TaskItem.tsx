'use client'

import React from 'react';
import clsx from 'clsx';

import { 
  EllipsisVerticalIcon,
  TrashIcon,
} from '@heroicons/react/24/outline';
import { useDebouncedCallback } from 'use-debounce';
import {
  Menu,
  MenuButton,
  MenuItem,
  MenuItems,
} from '@headlessui/react';

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
      <div className='flex flex-col'>
        <Input
          type='text'
          defaultValue={task.description}
          onChange={e => debouncedOnChange(e.target.value)}
        />
      </div>
      <Menu>
        <MenuButton className='ms-auto outline-none border-none'>
          <EllipsisVerticalIcon className='size-4' />
        </MenuButton>
        <MenuItems
          anchor='bottom end'
          className={clsx(
            'w-fit origin-top-left rounded-xl border border-white/5 bg-white/5',
            'transition duration-100 ease-out p-2'
          )} 
        >
          <MenuItem>
            <Button className='border-none flex flex-row gap-3 items-center p-1'>
              <TrashIcon className='size-4 stroke-red-500'/>
              Delete task
            </Button>
          </MenuItem>
        </MenuItems>
      </Menu>
    </div> 
  );
}

export default TaskItem;

