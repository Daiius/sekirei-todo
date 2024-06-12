import type { NextResponse } from 'next/server';

export type NextResponseBodyType<T> = T extends NextResponse<infer U> ? U : never;

export type ApiBodyType<T extends (...args: any) => any> =
  Awaited<ReturnType<T>> extends NextResponse<infer U> ? U : never;

