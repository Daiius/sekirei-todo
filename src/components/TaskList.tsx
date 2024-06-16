'use client'

import React from 'react';
import Button from '@/components/Button';

import {
  getTasks,
  addTask,
  GetTasksActionKey
} from '@/actions/tasksActions';
import useSWR from 'swr';

const TaskList: React.FC = () => {
  const { data: tasks, mutate } = useSWR(
    GetTasksActionKey, 
    (_url: string) => getTasks().then(t => t),
    { refreshInterval: 10_000 }
  );

  return (
    <div>
      {tasks?.map(task =>
        <div key={task.id}>{task.description}</div>
      )}
      <Button
        onClick={async () => {
          await addTask({ userId: 'tester', description: 'test task!' });
          mutate();
        }}
      >
        Test!
      </Button>
    </div>
  );
};

export default TaskList;

