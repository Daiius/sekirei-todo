import NextAuth from 'next-auth';
import { authConfig } from '@/auth.config';

const handler = NextAuth(authConfig).auth;

export { handler as GET, handler as POST};

