import { betterAuth } from "better-auth";
import { emailOTP } from "better-auth/plugins";
import { Pool } from "pg";
import { sendResendEmail } from "../integrations/email/resend";

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error("DATABASE_URL is required to start the auth service.");
}

const otpEnabled = process.env.AUTH_OTP_ENABLED !== "false";

async function sendAuthEmail({
  to,
  subject,
  text,
  html,
}: {
  to: string;
  subject: string;
  text: string;
  html: string;
}) {
  await sendResendEmail({ to, subject, text, html });
}

export const auth = betterAuth({
  baseURL: process.env.BETTER_AUTH_URL,
  secret: process.env.BETTER_AUTH_SECRET,
  database: new Pool({
    connectionString: databaseUrl,
  }),
  emailAndPassword: {
    enabled: true,
    sendResetPassword: async ({ user, url }) => {
      await sendAuthEmail({
        to: user.email,
        subject: "Reset your Muflah password",
        text: `Reset your password by opening this link: ${url}`,
        html: `<p>Reset your Muflah password by opening this link:</p><p><a href="${url}">${url}</a></p>`,
      });
    },
  },
  plugins: otpEnabled
    ? [
        emailOTP({
          overrideDefaultEmailVerification: true,
          sendVerificationOnSignUp: true,
          async sendVerificationOTP({ email, otp, type }) {
            const subject =
              type === "sign-in"
                ? "Your Muflah sign-in code"
                : "Verify your Muflah email";

            await sendAuthEmail({
              to: email,
              subject,
              text: `Your Muflah verification code is ${otp}. It expires soon.`,
              html: `<p>Your Muflah verification code is:</p><p><strong>${otp}</strong></p><p>It expires soon.</p>`,
            });
          },
        }),
      ]
    : [],
});
