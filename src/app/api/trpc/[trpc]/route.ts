import { fetchRequestHandler } from '@trpc/server/adapters/fetch';
import { appRouter } from '@/server';

const handler = (req: Request) =>
  fetchRequestHandler({
    endpoint: '/api/trpc',
    req,
    router: appRouter,
    //createContext: () => ({}),
  });

export { handler as GET, handler as POST };

//import { NextApiRequest, NextApiResponse, createNextApiHandler } from '@trpc/server/adapters/next';
//import { appRouter } from '@/server';
//
//const nextApiHandler = createNextApiHandler({
//  router: appRouter,
//});
//
//export default async function handler(
//  req: NextApiRequest,
//  res: NextApiResponse,
//) {
//  return nextApiHandler(req, res);
//}

