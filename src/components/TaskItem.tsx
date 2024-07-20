'use client'

import React from 'react';
import clsx from 'clsx';

import { EllipsisVerticalIcon } from '@heroicons/react/24/outline';
import { useDebouncedCallback } from 'use-debounce';
import {
  Menu,
  MenuButton,
  MenuItem,
  MenuItems,
} from '@headlessui/react';

import Input from '@/components/Input';

import { mutateTask } from '@/actions/tasksActions';

import { Task } from '@/types';
import DeleteTaskButton from './DeleteTaskButton';


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
      <Input
        type='text'
        defaultValue={task.description}
        onChange={e => debouncedOnChange(e.target.value)}
      />
      <Menu>
        <MenuButton className='ms-auto outline-none border-none'>
          <EllipsisVerticalIcon className='size-4' />
        </MenuButton>
        <MenuItems
          unmount={false}
          //anchor='bottom end'
          className={clsx(
            'w-fit origin-top-left rounded-xl border border-white/5 bg-white/5',
            'transition duration-100 ease-out p-2'
          )} 
        >
          <MenuItem>
            <DeleteTaskButton taskId={task.id} />
          </MenuItem>
        </MenuItems>
      </Menu>
    </div> 
  );
}

export default TaskItem;

