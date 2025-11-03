import TaskList from '@/components/TaskList';
import SekireiIcon from '@/components/SekireiIcon';
import TaskInput from '@/components/TaskInput';
import { Suspense } from 'react';

export default function TasksPage() {
  return (
    <main className='w-full flex-1 flex flex-col p-5 md:p-24 overflow-y-auto'>
      <SekireiIcon className='ml-auto mr-auto' />
      <div className='flex flex-col ml-auto mr-auto w-full md:w-[60%]'>
        <Suspense>
          <TaskList className='my-5'/>
        </Suspense>
        <TaskInput />
      </div>
    </main>
  );
}

