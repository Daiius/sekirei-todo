import clsx from 'clsx';

import TaskList from '@/components/TaskList';
import SekireiIcon from '@/components/SekireiIcon';

export default function TasksPage() {
  return (
    <main className={clsx(
      'flex h-[calc(100vh-3rem)] flex-col items-center',
      'p-5 md:p-24',
    )}>
      <SekireiIcon />
      <TaskList />
    </main>
  );
}

