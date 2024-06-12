'use client'

import React from 'react';
import useTypedSWR from '@/hooks/useTypedSWR';
import type { GetApiTypes } from '@/app/api/tasks/route';

const TaskList: React.FC = () => {
  // conditional fetch はできなくなってしまうのか...
  const { data: tasks } = useTypedSWR<GetApiTypes>('/api/tasks');
  return (
    <div>
      {tasks?.map(task =>
        <div>{task.description}</div>
      )}
    </div>
  );
};

export default TaskList;

