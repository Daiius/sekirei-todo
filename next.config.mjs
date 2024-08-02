/** @type {import('next').NextConfig} */
const nextConfig = {
  basePath: '/sekirei-todo',
  assetPrefix: '/sekirei-todo',
  publicRuntimeConfig: {
    basePath: '/sekirei-todo',
  },
  webpack(config) {
    return {
      ...config,
      optimization: {
        minimize: false
      },
    };
  },
};

export default nextConfig;
