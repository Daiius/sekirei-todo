'use client'

import { signIn } from '@/actions/authenticate';

import Button from '@/components/Button';
import { ArrowLeftEndOnRectangleIcon } from '@heroicons/react/24/outline';

const SignInButton: React.FC<
  React.ComponentProps<typeof Button>
> = ({
  className,
  ...props
}) => (
  <Button 
    className='mt-2 p-2 flex flex-row'
    onClick={async () => await signIn('github')}
    {...props}
  >
    Sign-in by Github
    <ArrowLeftEndOnRectangleIcon className='size-6 ml-2'/>
  </Button>
);

export default SignInButton;

