import { handlers } from "@/auth" // Referring to the auth.ts we just created
import { NextRequest } from 'next/server';
//export const { GET, POST } = handlers
//export const runtime = "edge" // optional

const basePath = '/sekirei-todo';

const toForwardedRequest = (req: NextRequest): NextRequest => {
  const forwardedHost = req.headers.get('x-forwarded-host');
  const forwardedProto = req.headers.get('x-forwarded-proto');
  if (forwardedHost && forwardedProto) {
    const forwardedUrl = 
      `${forwardedProto}://${forwardedHost}${basePath}${req.nextUrl.pathname}?${req.nextUrl.searchParams.toString()}`;
    const newReq = new NextRequest(forwardedUrl, {
      headers: req.headers,
      method: req.method,
      body: req.body,
    });
    return newReq;
  } else {
    return req;
  }
}

export const GET: (req: NextRequest) => Promise<Response> = 
  (req) => handlers.GET(toForwardedRequest(req));

export const POST: (req: NextRequest) => Promise<Response> = 
  (req) => handlers.POST(toForwardedRequest(req));
