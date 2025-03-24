/** @type {import('next').NextConfig} */
const nextConfig = {
  basePath: '/sekirei-todo',
  //assetPrefix: '/sekirei-todo',
  //publicRuntimeConfig: {
  //  basePath: '/sekirei-todo',
  //},
  serverExternalPackages: ['mysql2'],
  output: 'standalone',
};

export default nextConfig;
