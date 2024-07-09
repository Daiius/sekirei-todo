'use client'

import React from 'react';
import Button from '@/components/Button';

import { addTask } from '@/actions/tasksActions';

import useTypedSWR from '@/hooks/useTypedSWR';

const TaskList: React.FC = () => {
  const { data: tasks, mutate } = useTypedSWR(
    '/api/tasks', 
    { refreshInterval: 30_000 }
  );

  return (
    <div>
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

