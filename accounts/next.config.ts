import path from "node:path";
import type { NextConfig } from "next";

const authUrl = process.env.AUTH_URL;

if (!authUrl) throw new Error("AUTH_URL must be configured for the accounts app");

const nextConfig: NextConfig = {
  turbopack: { root: path.resolve(process.cwd(), "..") },
  transpilePackages: ["@muflah/account-switcher", "@muflah/onboarding"],
  async rewrites() {
    return [
      {
        source: "/auth-api/:path*",
        destination: `${authUrl}/api/auth/:path*`,
      },
      {
        source: "/onboarding-api/:path*",
        destination: `${authUrl}/api/onboarding/:path*`,
      },
    ];
  },
};

export default nextConfig;
