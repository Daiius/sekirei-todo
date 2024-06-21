import { signIn } from '@/auth';

export default function Page() {
  return (
    <form action={
      async (formData) => {
        'use server'
        await signIn("credentials", formData)
      }
    }>
      <input type='text' name='username' placeholder='User name' required />
      <input type='password' placeholder='Password' required />
    </form>
  )
}

