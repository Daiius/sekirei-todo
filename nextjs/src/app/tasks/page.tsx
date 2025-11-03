import { TaskList } from '@/components/TaskList';
import { SekireiIcon } from '@/components/SekireiIcon';
import { TaskInput } from '@/components/TaskInput';
import { Suspense } from 'react';

export default function TasksPage() {
  return (
    <main className='w-full flex-1 flex flex-col items-center p-6 gap-6 md:p-24 overflow-y-auto'>
      <SekireiIcon />
      <div className='flex flex-col gap-6 w-full md:w-[60%]'>
        <Suspense>
          <TaskList />
        </Suspense>
        <hr className='border-slate-500'/>
        <TaskInput />
      </div>
    </main>
  );
}
