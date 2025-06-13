import { NextConfig } from 'next';

const nextConfig = {
  serverExternalPackages: ['mysql2'],
  output: 'standalone',
} satisfies NextConfig;

export default nextConfig;
