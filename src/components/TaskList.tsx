'use client'

import React from 'react';
import Button from '@/components/Button';

import {
  getTasks,
  addTask,
} from '@/actions/tasksActions';

import useSWR from 'swr';

const TaskList: React.FC = () => {
  const { data: tasks, mutate } = useSWR(
    '/actions/tasks', 
    getTasks,
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

