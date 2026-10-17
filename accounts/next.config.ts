import type { NextConfig } from "next";

const authUrl = process.env.AUTH_URL ?? "http://localhost:3000";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: "/auth-api/:path*",
        destination: `${authUrl}/api/auth/:path*`,
      },
    ];
  },
};

export default nextConfig;
