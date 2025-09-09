import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  async rewrites() {
    return [
      {
        source: '/api/historian/:path*',
        destination: 'http://150.162.19.214:6156/historian/:path*',
      },
    ];
  },
};

export default nextConfig;
