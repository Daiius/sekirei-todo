import LoginForm from "@/components/LoginForm"
import { db } from '@/db'
import { users } from '@/db/schema'

import { getUser } from '@/auth';

//export const dynamic ='force-dynamic';

export default async function Page() {
  const test = await db.select().from(users);
  const testAuth = await getUser('tester');
  return (
    <>
      {test?.map(user => <div key={user.id}>{user.id}</div>)}
      { testAuth != null && 
        <div>{testAuth.username}, {testAuth.passWithSalt}</div>
      }
      <LoginForm />
    </>
  )
}

