/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  reactStrictMode: true,
  turbopack: {
    root: __dirname,
  },
  images: {
    unoptimized: true,
  },
};

module.exports = nextConfig;
