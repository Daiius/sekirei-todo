import { TaskList } from '@/components/TaskList';
import { SekireiIcon } from '@/components/SekireiIcon';
import { TaskInput } from '@/components/TaskInput';
import { Suspense } from 'react';

const TaskListSkeleton = () => (
  <div className='flex flex-col gap-3 items-center'>
    {Array.from({ length: 3 }).map((_, i) => 
      <div key={i} className='w-full h-12 rounded-md bg-slate-300 dark:bg-slate-700 animate-pulse'/>
    )}
  </div>
)

export default function TasksPage() {
  return (
    <main className='w-full flex-1 flex flex-col items-center p-6 gap-6 md:p-24 overflow-y-auto'>
      <SekireiIcon />
      <div className='flex flex-col gap-6 w-full md:w-[60%]'>
        <Suspense fallback={<TaskListSkeleton />} >
          <TaskList />
        </Suspense>
        <hr className='border-slate-200 dark:border-slate-500'/>
        <TaskInput />
      </div>
    </main>
  );
}
