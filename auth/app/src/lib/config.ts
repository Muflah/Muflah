import path from "node:path";
import { existsSync } from "node:fs";
import { config as loadDotEnv } from "dotenv";

const envCandidates = [
  path.resolve(process.cwd(), ".env"),
  path.resolve(process.cwd(), "..", ".env"),
];
const envFile = envCandidates.find((candidate) => existsSync(candidate));
if (envFile) loadDotEnv({ path: envFile });

function required(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`Missing required environment variable: ${name}`);
  return value;
}

function integer(name: string, fallback: number): number {
  const value = process.env[name];
  if (!value) return fallback;
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed) || parsed < 1) {
    throw new Error(`${name} must be a positive integer`);
  }
  return parsed;
}

export const config = {
  authUrl: required("BETTER_AUTH_URL"),
  secret: required("BETTER_AUTH_SECRET"),
  databaseUrl: required("DATABASE_URL"),
  emailDomain: required("AUTH_EMAIL_DOMAIN"),
  emailApiKey: required("EMAIL_API_KEY"),
  cookieDomain: process.env.AUTH_COOKIE_DOMAIN?.trim() || undefined,
  maxSessions: integer("AUTH_MAX_SESSIONS", 5),
  otpEnabled: process.env.AUTH_OTP_ENABLED !== "false",
  otpExpiresInSeconds: integer("AUTH_OTP_EXPIRES_IN_MINUTES", 10) * 60,
  otpMaxAttempts: integer("AUTH_OTP_MAX_ATTEMPTS", 5),
  otpResentLimit: integer("AUTH_OTP_RESENT_LIMIT", 3),
  otpResentInSeconds: integer("AUTH_OTP_RESENT_IN_SECONDS", 60),
};
