import path from "node:path";
import { existsSync } from "node:fs";
import { loadEnvConfig } from "@next/env";
import type { NextConfig } from "next";

const deploymentRoot = existsSync(path.resolve(process.cwd(), ".env"))
  ? process.cwd()
  : path.resolve(process.cwd(), "..");
loadEnvConfig(deploymentRoot);

const nextConfig: NextConfig = {
  reactStrictMode: true,
  agentRules: false,
};

export default nextConfig;
