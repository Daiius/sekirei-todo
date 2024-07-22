import clsx from 'clsx';

import TaskList from '@/components/TaskList';
import SekireiIcon from '@/components/SekireiIcon';
import TaskInput from '@/components/TaskInput';

export default function TasksPage() {
  return (
    <main className={clsx(
      'w-full h-[calc(100vh-3rem)] flex flex-col',
      'p-5 md:p-24',
    )}>
      <SekireiIcon className='ml-auto mr-auto' />
      <TaskList className='my-5 w-full md:w-[60%] ml-auto mr-auto'/>
      <TaskInput />
    </main>
  );
}

