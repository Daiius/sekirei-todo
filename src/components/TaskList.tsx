'use client'

import React from 'react';
import Button from '@/components/Button';

import { addTask } from '@/actions/tasksActions';

import { trpc } from '@/trpc/client';

const TaskList: React.FC = () => {

  const utils = trpc.useUtils();
  const { data } = trpc.hello.useQuery();
  const { data: tasks } = trpc.task.getTasks.useQuery(
    undefined, { staleTime: 10_000 }
  );

  return (
    <div>
      {data?.msg && <div>{data.msg}</div>}
      {tasks?.map(task =>
        <div key={task.id}>{task.description}</div>
      )}
      <Button
        onClick={async () => {
          await addTask({ description: 'test task!' });
          utils.task.invalidate();
        }}
      >
        Test!
      </Button>
    </div>
  );
};

export default TaskList;

