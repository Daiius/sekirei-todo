import React from 'react';
import clsx from 'clsx';

//import { Input as HeadlessInput } from '@headlessui/react';

const Input: React.FC<React.ComponentProps<'input'>> = ({
  className,
  ...props
}) => (
  <input
    className={clsx(
      'border border-1 border-slate-300 dark:border-slate-800',
      'bg-transparent',
      'focus:outline focus:outline-1 focus:outline-slate-300',
      'rounded-md px-2 w-full',
    )}
    {...props}
  />
);

export default Input;

