'use client'

import React from 'react';
import Button from '@/components/Button';
import { ArrowLeftStartOnRectangleIcon } from '@heroicons/react/24/outline';

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
          mutate();
        }}
      >
        Test!
      </Button>
      <Button 
        className='flex flex-row'
        onClick={async () => await logOut()}
      >
        Logout
        <ArrowLeftStartOnRectangleIcon className='ml-1 size-6'/>
      </Button>
    </div>
  );
};

export default TaskList;

