'use client'

import React from 'react';
import clsx from 'clsx';

import { Button as HeadlessButton } from '@headlessui/react';

const Button: React.FC<React.ComponentProps<typeof HeadlessButton>> = ({
  className,
  children,
  ...props
}) => (
  <HeadlessButton
    type='button'
    className={clsx(
      'border border-1 border-slate-500 rounded-md',
      'dark:border-slate-300',
      'text-slate-500 dark:text-slate-100 p-1',
      'hover:bg-slate-200 dark:hover:bg-slate-100/10',
      'active:outline active:outline-1 active:outline-slate-400 dark:active:outline-slate-200',
      'focus:outline focus:outline-1 focus:outline-slate-400 dark:focus:outline-slate-200',
      className,
    )}
    {...props}
  >
    {children}
  </HeadlessButton>
);

export default Button;

