import clsx from 'clsx';

import { getTasks } from '@/actions/tasksActions';
import { TaskItem } from './TaskItem';

type TaskListProps = {
  className?: string,
}

/**
 * ToDo Taskの一覧を取得します
 *
 * 1ユーザあたり（1画面当たり）高々100個程度のToDoを
 * 管理するつもりなので、TaskListコンポーネントが
 * 一括でTask[]を取得し、子コンポーネントに伝えます。
 *
 */
export const TaskList = async ({
  className,
}: TaskListProps) => {
  'use cache: private'
  const tasks = await getTasks();
  return (
    <div
      className={clsx(
        'text-lg flex flex-col gap-3',
        className,
      )}
    >
      {tasks?.map(task =>
        <TaskItem key={task.id} task={task} />
      )}
    </div>
  );
};
