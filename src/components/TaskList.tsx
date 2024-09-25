import React from 'react';
import clsx from 'clsx';

import { getTasks } from '@/actions/tasksActions';
import TaskItem from './TaskItem';

/**
 * ToDo Taskの一覧を取得します
 *
 * 1ユーザあたり（1画面当たり）高々100個程度のToDoを
 * 管理するつもりなので、TaskListコンポーネントが
 * 一括でTask[]を取得し、子コンポーネントに伝えます。
 *
 */
const TaskList: React.FC<React.ComponentProps<'div'>> = async ({
  className,
  ...props
}) => {
  const tasks = await getTasks();
  return (
    <div
      className={clsx(
        'text-lg flex flex-col gap-3',
        className,
      )}
      {...props}
    >
      {tasks?.map(task =>
        <TaskItem key={task.id} task={task} />
      )}
    </div>
  );
};

export default TaskList;

