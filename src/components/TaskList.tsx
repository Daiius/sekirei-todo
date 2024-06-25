'use client'

import React from 'react';
import Button from '@/components/Button';

import {
  getTasks,
  addTask,
} from '@/actions/tasksActions';
import { logOut } from '@/actions/authenticate';

import useSWR from 'swr';

const TaskList: React.FC = () => {
  const { data: tasks, mutate } = useSWR(
    '/actions/tasks', 
    () => getTasks().then(t => t),
    { refreshInterval: 10_000 }
  );

  return (
    <div>
      {tasks?.map(task =>
        <div key={task.id}>{task.description}</div>
      )}
      <Button
        onClick={async () => {
          await addTask({
            userId: 'tester', description: 'test task!' 
          });
          mutate();
        }}
      >
        Test!
      </Button>
      <Button onClick={async () => await logOut()}>
        Logout
      </Button>
    </div>
  );
};

export default TaskList;

