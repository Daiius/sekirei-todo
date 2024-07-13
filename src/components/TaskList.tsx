'use client'

import React from 'react';
import clsx from 'clsx';

import Button from '@/components/Button';
import Input from '@/components/Input';
import { 
  EllipsisVerticalIcon,
  Bars3Icon,
} from '@heroicons/react/24/outline';
import { useDebouncedCallback } from 'use-debounce';

import { addTask } from '@/actions/tasksActions';

import { trpc } from '@/trpc/client';

import type { inferRouterOutputs } from '@trpc/server';
import type { AppRouter } from '@/server';

type ExtractElement<T> = T extends (infer U)[] ? U : never;

type Task = ExtractElement<
  inferRouterOutputs<AppRouter>['task']['getTasks']
>;

type TaskItemProps = {
  task: Task;
} & React.ComponentProps<'div'>;

const TaskItem: React.FC<TaskItemProps> = ({ 
  task,
  ...props
}) => {
  const [error, setError] = React.useState<string|undefined>();
  const mutation = trpc.task.editTask.useMutation({
    onError: (error) => setError(error.message),
    onSuccess: () => setError(undefined),
  });
  const debouncedOnChange = useDebouncedCallback(
    async (value: string) => await mutation.mutateAsync({
      taskId: task.id, newDescription: value
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
        {error != null && <span>{error}</span>}
      </div>
      <Button className='ms-auto outline-none border-none'>
        <EllipsisVerticalIcon className='size-4' />
      </Button>
    </div> 
  );
}


/**
 * ToDo Taskの一覧を取得します
 *
 * 1ユーザあたり（1画面当たり）高々100個程度のToDoを
 * 管理するつもりなので、TaskListコンポーネントが
 * 一括でTask[]を取得し、子コンポーネントに伝えます。
 *
 */
const TaskList: React.FC = () => {

  const utils = trpc.useUtils();
  const { data: tasks } = trpc.task.getTasks.useQuery(
    undefined, { staleTime: 10_000 }
  );

  return (
    <div className='text-lg flex flex-col gap-3'>
      {tasks?.map(task =>
        <TaskItem key={task.id} task={task} />
      )}
      {/*
      <Button
        onClick={async () => {
          await addTask({ description: 'test task!' });
          utils.task.invalidate();
        }}
      >
        Test!
      </Button>
      */}
    </div>
  );
};

export default TaskList;

