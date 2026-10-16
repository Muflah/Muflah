# Authentication Implementation

## Runtime

- Framework: Next.js App Router.
- Runtime: Node.js server runtime.
- Auth library: Better Auth.
- Database: PostgreSQL through `pg`.
- Email delivery: Resend HTTP API.
- Deployment: Vercel currently; DigitalOcean remains a compatible future hosting target.

## Environment variables

```env
DATABASE_URL=postgresql://...
BETTER_AUTH_SECRET=...
BETTER_AUTH_URL=https://auth.muflah.com
AUTH_COOKIE_DOMAIN=muflah.com

AUTH_EMAIL_DOMAIN=mail.muflah.com
EMAIL_API_KEY=...

AUTH_OTP_ENABLED=true
AUTH_OTP_EXPIRES_IN_MINUTES=3
AUTH_OTP_MAX_ATTEMPTS=3
AUTH_MAX_SESSIONS=4
```

`AUTH_EMAIL_DOMAIN` and `EMAIL_API_KEY` are required for email delivery. There is no apex-domain or `BETTER_AUTH_URL` fallback. `EMAIL_API_KEY` is provider-neutral naming; the current implementation still uses the Resend adapter.

`AUTH_COOKIE_DOMAIN` is optional. When set, Better Auth enables cross-subdomain cookies for that parent domain. When missing or empty, cookies remain host-only. In production, the intended value is `muflah.com`; consuming applications must still call the auth API with credentials included and use the approved auth origins.

Sender aliases are selected by message purpose. Account-creation and welcome messages use `hello@<AUTH_EMAIL_DOMAIN>`. Authentication, OTP, password-reset, and other security messages use `auth@<AUTH_EMAIL_DOMAIN>`; the adapter still defaults to `no-reply` for callers that do not specify an alias.

## Better Auth configuration

The service enables:

- `emailAndPassword` for credential authentication and password reset links.
- `emailOTP` for signup email verification.
- `twoFactor` with email OTP for login step-up verification.
- `username` for the globally unique platform username.
- Signed trusted-device cookies with a 30-day lifetime.

The user schema also includes `dateOfBirth` and `onboardingComplete`. Existing users are backfilled as complete only when they already have a credential account.

OTP settings are read from the environment. Better Auth receives the email OTP lifetime in seconds, so the application converts the configured minute value.

Better Auth's official `multiSession` plugin manages multiple account sessions in one browser. `AUTH_MAX_SESSIONS` controls the maximum and accepts values from 1 through 10; empty, invalid, or out-of-bounds values safely default to 1. The authenticated username screen lists available sessions, supports switching, and links to the root signup flow for adding another account. The value must be configured in the Vercel environment for deployed behavior; changing `.env` locally does not change Vercel.

## Important routes

```text
GET/POST /api/auth/[...all]
```

The standard Better Auth JSON API, including sessions, password login, password reset, email OTP, and two-factor endpoints.

The browser uses Better Auth's official client methods directly. The service does not add wrapper routes for authentication decisions:

- `authClient.signIn.email({ email, password })` signs in with credentials.
- `authClient.signUp.email({ email, password, name })` creates an account.
- `authClient.emailOtp.verifyEmail({ email, otp })` verifies signup email ownership.
- `authClient.twoFactor.sendOtp()` and `authClient.twoFactor.verifyOtp()` handle login step-up OTP.
- `authClient.twoFactor.enable({ password, method: "otp" })` enables OTP protection after signup verification.
- `authClient.requestPasswordReset()` starts the official password-reset flow.

The UI asks the user to choose sign-in or signup before the password step. It never probes account existence to decide which Better Auth operation to call.

```text
GET /api/auth-flow/status
```

Returns the authenticated signup/account state, including the persisted username, so the client can resume password creation or profile completion after an interrupted flow. The onboarding guard requires the persisted completion flag and the platform name, username, and date of birth.

```text
POST /api/auth-flow/complete-profile
```

Validates and saves the platform name, username, and date of birth, then marks onboarding complete.

There are no custom password, signup-OTP, or email-OTP wrapper routes. This keeps credential validation, OTP consumption, session issuance, and error handling inside Better Auth.

The root auth screen contains the authenticated shell. It shows the current account card and profile state, and collects the platform name, username, and date of birth when onboarding is incomplete. The username is profile data; it is not used as an authentication route.

The root shell uses Better Auth's official `multiSessionClient()` to list browser sessions and activate another account in place. The account switcher is a sidebar select with an add-account action. Add account is a popup flow; `/?mode=add-account` remains a compatibility entry point that opens the popup. Better Auth's own session client manages session refresh, focus refresh, and session state after `setActive`; the service does not add a second cross-tab session handler.

```text
GET /reset-password
```

Minimal password-reset screen that consumes Better Auth reset tokens.

## Password storage

Better Auth hashes passwords before storing them. The credential record is stored in `account`:

```text
account.providerId = credential
account.userId = user.id
account.password = hashed password
```

Passwords are never stored in the `user` table, logged, or returned to clients.

## Database migration

Run migrations deliberately against the target database:

```bash
npm run db:migrate -- --yes
```

The two-factor rollout adds:

- `user.twoFactorEnabled`
- `twoFactor` table fields for the Better Auth two-factor plugin

The platform profile rollout adds:

- `user.username`
- `user.displayUsername`
- `user.dateOfBirth`
- `user.onboardingComplete`

Do not run migrations automatically from every serverless instance. For a separate production database, run the migration once before deploying code that depends on the new schema.

## Verification commands

```bash
npm run typecheck
npm run build
git diff --check
```

The build may emit the PostgreSQL SSL-mode compatibility warning from `pg-connection-string`; it does not currently fail the build.

## Current limitations

- Resend is the only implemented email adapter.
- Resend delivery webhooks are not yet processed; accepted email requests can still later bounce.
- Resend cooldowns and email/IP rate limiting need a dedicated production-hardening pass.
- Explicit trusted-device revocation UI, JWT issuance, JWKS, and global cross-device session limits remain future work. Cross-tab account-switch synchronization is implemented as a best-effort browser UI convenience.
