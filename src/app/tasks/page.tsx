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
      <div className='flex flex-col ml-auto mr-auto w-full md:w-[60%]'>
        <TaskList className='my-5'/>
        <TaskInput />
      </div>
    </main>
  );
}

