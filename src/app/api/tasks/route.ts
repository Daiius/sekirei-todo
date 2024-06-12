
import { db } from '@/db';
import { tasks } from '@/db/schema';
import {ApiBodyType} from '@/lib/common';
import { NextResponse } from 'next/server';

export interface GetApiTypes {
  "/api/tasks": ApiBodyType<typeof GET>
}

export const GET = async () => NextResponse.json(
  await db.select().from(tasks)
)

