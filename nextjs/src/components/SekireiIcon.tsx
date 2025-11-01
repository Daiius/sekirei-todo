import React from 'react';
import clsx from 'clsx';

import Image from 'next/image';

const SekireiBody: React.FC<React.ComponentProps<'div'>> = (
  props
) => (
  <div {...props}>
    <Image
      width={200} height={200}
      src='/sekirei_body_fill.svg'
      alt='sekirei icon body'
      priority
    />
  </div>
);

const SekireiTail: React.FC<React.ComponentProps<'div'>> = (
  props
) => (
  <div {...props}>
    <Image
      width={200} height={200}
      src='/sekirei_tail_fill.svg'
      alt='sekirei icon tail'
      priority
    />
  </div>
);

const SekireiIcon: React.FC<React.ComponentProps<'div'>> = ({
  className,
  ...props
}) => (
  <div
    {...props}
    className={clsx(
      'min-size-[200px] size-[200px] bg-gradient-radial from-slate-400 from-60% to-slate-200/10',
      className
    )}
  >
    <SekireiTail 
      className={clsx(
        'absolute animate-tail-wag',
        'stroke-white fill-slate-400 stroke-2',
        'origin-[60%_50%]',
      )}
    />
    <SekireiBody 
      className={clsx(
        'absolute', 
        'stroke-white stroke-2 fill-slate-400',
      )}
    />
  </div>
);

export default SekireiIcon;

