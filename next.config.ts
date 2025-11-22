import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  // Ensure CSS and assets are optimized in production
  reactStrictMode: true,
  // Note: swcMinify is enabled by default in Next.js 16, no need to specify
};

export default nextConfig;
