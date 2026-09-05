import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  devIndicators: false,
  transpilePackages: ["@splinetool/runtime"],
  async rewrites() {
    return [
      {
        source: "/api-backend/:path*",
        destination: `${process.env.NEXT_PUBLIC_API_BASE ?? "http://127.0.0.1:8000"}/:path*`,
      },
    ];
  },
};

export default nextConfig;
