/**
 * server actionを乱用してあたかも型付きのWeb APIかのように
 * 呼び出すためのカスタムフック
 */

'use client'

import React from 'react';
import { tasks } from '@/db/schema';

type Tasks = (typeof tasks.$inferSelect)[];

export type UseTaksResult = {
  tasks: Tasks;
  isLoading: boolean;
  error: any;
}

const useTasks = () => {
};
