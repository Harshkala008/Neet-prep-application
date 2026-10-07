/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['@neet/shared'],
  output: 'export',
  trailingSlash: true,
};

export default nextConfig;
