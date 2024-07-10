import { createTRPCReact } from '@trpc/react-query';
import { createSWRProxyHooks } from '@trpc-swr/client';
import type { AppRouter } from '@/server';
import { httpBatchLink } from '@trpc/client'

//export const trpc = createSWRProxyHooks<AppRouter>({
export const trpc = createTRPCReact<AppRouter>({
//  links: [
//    httpBatchLink({
//      url: 'http://localhost:3000/api/trpc',
//    }),
//  ],
});

