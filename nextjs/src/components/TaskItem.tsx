'use client'

import clsx from 'clsx';

import { useDebouncedCallback } from 'use-debounce';

import { updateTask } from '@/actions/tasksActions';
import { Task } from '@/types';

import Input from '@/components/Input';
import TaskItemMenu from './TaskItemMenu';


export type TaskItemProps = {
  task: Task;
  className?: string;
};

export const TaskItem: React.FC<TaskItemProps> = ({ 
  task,
  className,
}) => {
  const debouncedOnChange = useDebouncedCallback(
    async (value: string) => await updateTask({
      id: task.id, description: value
    }),
    500
  );

  return (
    <div
      className={clsx(
        'flex flex-row items-center gap-3',
        'p-2 border border-slate-300 rounded-md',
        className
      )}
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
