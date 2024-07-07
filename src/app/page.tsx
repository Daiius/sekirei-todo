import clsx from 'clsx';

import TaskList from '@/components/TaskList';
import SekireiIcon from '@/components/SekireiIcon';

export default function TasksPage() {
  return (
    <main className={clsx(
      "flex min-h-screen flex-col items-center justify-between p-24"
    )}>
      <div className={clsx(
        "z-10 w-full max-w-5xl items-center justify-between",
        "font-mono text-sm lg:flex"
      )}>
        <SekireiIcon />
        <TaskList />
      </div>
    </main>
  );
}

