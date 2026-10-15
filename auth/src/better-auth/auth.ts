import { betterAuth } from "better-auth";
import { emailOTP, multiSession, twoFactor, username } from "better-auth/plugins";
import { Pool } from "pg";
import { sendResendEmail } from "../integrations/email/resend";

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error("DATABASE_URL is required to start the auth service.");
}

export const database = new Pool({
  connectionString: databaseUrl,
});

const otpEnabled = process.env.AUTH_OTP_ENABLED !== "false";
const maximumAllowedSessions = 10;

function maximumSessions() {
  const value = Number(process.env.AUTH_MAX_SESSIONS?.trim());
  if (!Number.isInteger(value) || value < 1 || value > maximumAllowedSessions) {
    return 1;
  }
  return value;
}

function positiveMinutes(name: string, fallback: number) {
  const value = Number(process.env[name] ?? fallback);
  if (!Number.isFinite(value) || value <= 0) {
    throw new Error(`${name} must be a positive number of minutes.`);
  }
  return value;
}

const otpPeriodMinutes = positiveMinutes("AUTH_OTP_EXPIRES_IN_MINUTES", 3);
const otpAllowedAttempts = Number(process.env.AUTH_OTP_MAX_ATTEMPTS ?? 3);
if (!Number.isInteger(otpAllowedAttempts) || otpAllowedAttempts < 1) {
  throw new Error("AUTH_OTP_MAX_ATTEMPTS must be a positive whole number.");
}

const maxSessions = maximumSessions();

async function sendAuthEmail({
  to,
  subject,
  text,
  html,
  alias = "auth",
}: {
  to: string;
  subject: string;
  text: string;
  html: string;
  alias?: string;
}) {
  await sendResendEmail({ to, subject, text, html, alias });
}

export const auth = betterAuth({
  baseURL: process.env.BETTER_AUTH_URL,
  secret: process.env.BETTER_AUTH_SECRET,
  database,
  user: {
    additionalFields: {
      dateOfBirth: {
        type: "string",
        required: false,
        returned: true,
      },
      onboardingComplete: {
        type: "boolean",
        required: false,
        defaultValue: false,
        returned: true,
      },
    },
  },
  emailAndPassword: {
    enabled: true,
    sendResetPassword: async ({ user, url }) => {
      await sendAuthEmail({
        to: user.email,
        subject: "Reset your Muflah password",
        text: `Reset your password by opening this link: ${url}`,
        html: `<p>Reset your Muflah password by opening this link:</p><p><a href="${url}">${url}</a></p>`,
        alias: "auth",
      });
    },
  },
  plugins: otpEnabled
    ? [
        username(),
        multiSession({ maximumSessions: maxSessions }),
        twoFactor({
          issuer: "Muflah",
          trustDeviceMaxAge: 30 * 24 * 60 * 60,
          twoFactorCookieMaxAge: 10 * 60,
          otpOptions: {
            period: otpPeriodMinutes,
            allowedAttempts: otpAllowedAttempts,
            async sendOTP({ user, otp }) {
              await sendAuthEmail({
                to: user.email,
                subject: "Your Muflah security code",
                text: `Your Muflah security code is ${otp}. It expires soon.`,
                html: `<p>Your Muflah security code is:</p><p><strong>${otp}</strong></p><p>It expires soon.</p>`,
                alias: "auth",
              });
            },
          },
        }),
        emailOTP({
          overrideDefaultEmailVerification: true,
          sendVerificationOnSignUp: true,
          otpLength: 6,
          expiresIn: otpPeriodMinutes * 60,
          allowedAttempts: otpAllowedAttempts,
          async sendVerificationOTP({ email, otp, type }) {
            const subject = type === "sign-in" ? "Your Muflah verification code" : "Verify your Muflah email";

            await sendAuthEmail({
              to: email,
              subject,
              text: `Your Muflah verification code is ${otp}. Use it to continue. It expires soon.`,
              html: `<p>Your Muflah verification code is:</p><p><strong>${otp}</strong></p><p>Use it to continue. It expires soon.</p>`,
              alias: "auth",
            });
          },
        }),
      ]
    : [username(), multiSession({ maximumSessions: maxSessions })],
});
