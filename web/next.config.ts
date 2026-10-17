import type { NextConfig } from "next";

const authUrl = process.env.AUTH_URL;
if (!authUrl) throw new Error("AUTH_URL must be configured for the web app");

const nextConfig: NextConfig = {
  async rewrites() {
    return [{ source: "/auth-api/:path*", destination: `${authUrl}/api/auth/:path*` }];
  },
};

export default nextConfig;
