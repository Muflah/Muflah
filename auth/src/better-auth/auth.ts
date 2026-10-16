import { betterAuth } from "better-auth";
import { emailOTP, multiSession, twoFactor, username } from "better-auth/plugins";
import { Pool } from "pg";
import { sendResendEmail } from "../integrations/email/resend";

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) throw new Error("DATABASE_URL is required to start the auth service.");

export const database = new Pool({ connectionString: databaseUrl });
const cookieDomain = process.env.AUTH_COOKIE_DOMAIN?.trim();
const otpMinutes = Number(process.env.AUTH_OTP_EXPIRES_IN_MINUTES ?? 3);
const maxSessions = Number(process.env.AUTH_MAX_SESSIONS ?? 1);

export const auth = betterAuth({
  baseURL: process.env.BETTER_AUTH_URL,
  secret: process.env.BETTER_AUTH_SECRET,
  database,
  ...(cookieDomain ? { advanced: { crossSubDomainCookies: { enabled: true, domain: cookieDomain } } } : {}),
  user: { additionalFields: { dateOfBirth: { type: "string", required: false, returned: true }, onboardingComplete: { type: "boolean", required: false, defaultValue: false, returned: true } } },
  emailAndPassword: {
    enabled: true,
    sendResetPassword: async ({ user, url }) => {
      await sendResendEmail({
        to: user.email,
        subject: "Reset your Muflah password",
        text: `Reset your password by opening this link: ${url}`,
        html: `<p>Reset your password by opening this link:</p><p><a href="${url}">${url}</a></p>`,
        alias: "auth",
      });
    },
  },
  plugins: [
    username(),
    multiSession({ maximumSessions: Number.isInteger(maxSessions) && maxSessions >= 1 && maxSessions <= 10 ? maxSessions : 1 }),
    emailOTP({
      overrideDefaultEmailVerification: true,
      sendVerificationOnSignUp: true,
      expiresIn: Number.isFinite(otpMinutes) && otpMinutes > 0 ? otpMinutes * 60 : 180,
      async sendVerificationOTP({ email, otp }) {
        await sendResendEmail({ to: email, subject: "Verify your Muflah email", text: `Your Muflah verification code is ${otp}.`, html: `<p>Your Muflah verification code is:</p><p><strong>${otp}</strong></p>`, alias: "auth" });
      },
    }),
    twoFactor({
      issuer: "Muflah",
      otpOptions: {
        period: Number.isFinite(otpMinutes) && otpMinutes > 0 ? otpMinutes : 3,
        async sendOTP({ user, otp }) {
          await sendResendEmail({ to: user.email, subject: "Your Muflah security code", text: `Your Muflah security code is ${otp}.`, html: `<p>Your Muflah security code is:</p><p><strong>${otp}</strong></p>`, alias: "auth" });
        },
      },
    }),
  ],
});
