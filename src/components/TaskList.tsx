import React from 'react';

import { getTasks } from '@/actions/tasksActions';
import TaskItem from './TaskItem';
import TaskInput from './TaskInput';

/**
 * ToDo Taskの一覧を取得します
 *
 * 1ユーザあたり（1画面当たり）高々100個程度のToDoを
 * 管理するつもりなので、TaskListコンポーネントが
 * 一括でTask[]を取得し、子コンポーネントに伝えます。
 *
 */
const TaskList: React.FC = async () => {
  const tasks = await getTasks();
  return (
    <div className='text-lg flex flex-col gap-3'>
      {tasks?.map(task =>
        <TaskItem key={task.id} task={task} />
      )}
      <TaskInput />
    </div>
  );
};

export default TaskList;

