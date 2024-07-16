/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config) => {
    return {
      ...config,
      optimization: {
        minimize: false
      },
    }
  },
};

export default nextConfig;
