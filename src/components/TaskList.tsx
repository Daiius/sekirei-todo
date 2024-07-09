'use client'

import React from 'react';
import Button from '@/components/Button';

import { addTask } from '@/actions/tasksActions';

import useTypedSWR from '@/hooks/useTypedSWR';
import { trpc } from '@/trpc/client';

const TaskList: React.FC = () => {
  const { data: tasks, mutate } = useTypedSWR(
    '/api/tasks', 
    { refreshInterval: 30_000 }
  );
  const { data } = trpc.hello.useQuery();

  return (
    <div>
      {data?.msg && <div>{data.msg}</div>}
      {tasks?.map(task =>
        <div key={task.id}>{task.description}</div>
      )}
      <Button
        onClick={async () => {
          await addTask({ description: 'test task!' });
          await mutate();
        }}
      >
        Test!
      </Button>
    </div>
  );
};

export default TaskList;

