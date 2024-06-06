import React from 'react';
import clsx from 'clsx';
import { Button as HuiButton } from '@headlessui/react';

const Button: React.FC<React.ComponentProps<typeof HuiButton>> = ({
  className,
  children,
  ...props
}) => (
  <HuiButton
    {...props}
    className={clsx(
      'border border-1 border-slate-500 rounded-md',
      'dark:border-slate-300',
      'text-slate-500 dark:text-slate-100 p-1',
      'hover:bg-slate-200',
      'focus:outline focus:outline-2 focus:outline-slate-400',
      className,
    )}
  >
    {children}
  </HuiButton>
);

export default Button;

