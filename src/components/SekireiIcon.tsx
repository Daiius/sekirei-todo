import React from 'react';
import clsx from 'clsx';

import Image from 'next/image';

const SekireiBody: React.FC<React.ComponentProps<'div'>> = (
  props
) => (
  <div {...props}>
    <Image
      width={100} height={100}
      src='/sekirei_body_fill.svg'
      //src='/sekirei_body_fill.png'
      alt='sekirei icon body'
    />
  </div>
);

const SekireiTail: React.FC<React.ComponentProps<'div'>> = (
  props
) => (
  <div {...props}>
    <Image
      width={100} height={100}
      src='/sekirei_tail_fill.svg'
      alt='sekirei icon tail'
    />
  </div>
);

const SekireiIcon: React.FC = () => (
  <div>
    <SekireiTail 
      className={clsx(
        'absolute animate-tail-wag top-0',
        'stroke-white fill-slate-400 stroke-2',
      )}
    />
    <SekireiBody 
      className={clsx(
        'absolute top-0', 
        'stroke-white stroke-2 fill-slate-400',
      )}
    />
  </div>
);

export default SekireiIcon;

