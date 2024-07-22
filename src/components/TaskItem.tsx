'use client'

import React from 'react';
import clsx from 'clsx';

import { useDebouncedCallback } from 'use-debounce';

import { mutateTask } from '@/actions/tasksActions';
import { Task } from '@/types';

import Input from '@/components/Input';
import TaskItemMenu from './TaskItemMenu';


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
      <TaskItemMenu taskId={task.id} />
    </div> 
  );
}

export default TaskItem;

