import React from 'react';

const SekireiBody: React.FC<React.ComponentProps<'div'>> = (props) => (
  <div {...props}>
  <svg width="100" height="100" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
    <circle cx="50" cy="30" r="10" fill="black" />
    <rect x="45" y="40" width="10" height="20" fill="black" />
    <circle cx="50" cy="50" r="5" fill="white" />
  </svg>
  </div>
);

const SekireiTail: React.FC<React.ComponentProps<'div'>> = (props) => (
  <div {...props}>
  <svg width="20" height="50" viewBox="0 0 20 50" xmlns="http://www.w3.org/2000/svg">
    <rect x="5" y="0" width="10" height="50" fill="black" />
  </svg>
  </div>
);

const SekireiIcon: React.FC = () => (
  <div>
    <SekireiTail className='animate-tail-wag' />
    <SekireiBody />
  </div>
);

export default SekireiIcon;

