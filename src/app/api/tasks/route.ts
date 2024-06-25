
import { db } from '@/db';
import { tasks } from '@/db/schema';
import { ApiBodyType } from '@/lib/common';
import { NextRequest, NextResponse } from 'next/server';

declare module '@/types/api' {
  export interface GetApiTypes {
    "/api/tasks":
      ApiBodyType<typeof GET>
  }
  export interface PostBodyTypes {
    "/api/tasks":
      Omit<typeof tasks.$inferInsert, 'id'|'createdAt'|'done'>,
  }
}

export const GET = async () => NextResponse.json(
  await db.select().from(tasks)
);


export const POST = async (request: NextRequest) => {
  const data = await request.json();
    await db.insert(tasks).values(data);
    return NextResponse.json(data);
};

