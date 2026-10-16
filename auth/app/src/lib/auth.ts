import { betterAuth } from "better-auth";
import { emailOTP, multiSession, username } from "better-auth/plugins";
import { config } from "./config";
import { database } from "./database";
import { otpEmail, sendTransactionalEmail } from "./email/connector";

export const auth = betterAuth({
  database,
  baseURL: config.authUrl,
  secret: config.secret,
  trustedOrigins: [config.authUrl],
  databaseHooks: {
    user: {
      create: {
        after: async (user) => {
          await sendTransactionalEmail({
            to: user.email,
            type: "welcome",
            subject: "Welcome to Muflah",
            html: `<p>Welcome to Muflah, ${user.name}.</p><p>Your account has been created. We’re glad to have you here.</p>`,
          });
        },
      },
    },
  },
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: true,
    revokeSessionsOnPasswordReset: true,
    sendResetPassword: async ({ user, url }) => {
      await sendTransactionalEmail({
        to: user.email,
        type: "password-reset",
        subject: "Reset your password",
        html: `<p>Reset your password by <a href="${url}">opening this secure link</a>.</p>`,
      });
    },
  },
  plugins: [
    username({
      displayUsername: false,
      immutableUsername: true,
    }),
    multiSession({ maximumSessions: config.maxSessions }),
    ...(config.otpEnabled
      ? [
          emailOTP({
            expiresIn: config.otpExpiresInSeconds,
            allowedAttempts: config.otpMaxAttempts,
            rateLimit: {
              window: config.otpResentInSeconds,
              max: config.otpResentLimit,
            },
            sendVerificationOnSignUp: true,
            overrideDefaultEmailVerification: true,
            storeOTP: "hashed",
            sendVerificationOTP: async ({ email, otp, type }) => {
              await sendTransactionalEmail({
                to: email,
                type: "otp",
                subject: `Your ${type.replace("-", " ")} code`,
                html: otpEmail(otp),
              });
            },
          }),
        ]
      : []),
  ],
});
