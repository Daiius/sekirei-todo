
import type { getTasks } from '@/actions/tasksActions';


type ExtractElement<T> = T extends (infer E)[] ? E : never;

export type Task = ExtractElement<Awaited<ReturnType<typeof getTasks>>>;


