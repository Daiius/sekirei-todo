'use server';

import { db } from "@/db";
import { eq } from 'drizzle-orm';
import { users } from "@/db/schema";

export async function getUser(username: string): Promise<{
  username: string;
  passWithSalt: string;
} |undefined> {
  console.log('getUser()');
  try {
    const user = await db.select().from(users).where(eq(users.id, username));
    return { username: user[0].id, passWithSalt: user[0].passWithSalt };
  } catch (error) {
    console.error('Failed to fetch user:', error);
    throw new Error(`Failed to fetch user: ${error}`);
  }
}
