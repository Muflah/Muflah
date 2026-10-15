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

```text
POST /api/auth-flow/verify-signup-otp
```

Email-first OTP verification. It verifies and consumes the OTP exactly once before branching to existing-account password login or new-account password creation, preserving existing credential accounts. The route must not call both `checkVerificationOTP` and `signInEmailOTP` for the same code.

```text
POST /api/auth-flow/request-email-otp
```

Requests the neutral email-first OTP for both registered and unregistered email addresses and returns a consistent JSON delivery error when the provider rejects the request.

```text
POST /api/auth-flow/finish-signup
```

Completes a verified signup by validating the password, creating the credential password, and enabling email OTP two-factor protection. This creates the account with onboarding incomplete; it does not collect profile fields.

```text
GET /api/auth-flow/status
```

Returns the authenticated signup/account state, including the persisted username, so the client can resume password creation or profile completion after an interrupted flow and redirect completed sessions to the correct dynamic username path. The onboarding guard requires the persisted completion flag and the platform name, username, and date of birth.

```text
POST /api/auth-flow/complete-profile
```

Validates and saves the platform name, username, and date of birth, then marks onboarding complete.

```text
POST /api/auth-flow/verify-password
```

Verifies the password against the email-OTP-authenticated session. This prevents the email proof and password steps from immediately triggering a duplicate two-factor OTP challenge.

```text
/onboarding
```

The identity setup screen shown after authentication for new accounts and existing accounts with incomplete profiles. It collects the platform name, username, and date of birth.

```text
/<username>
```

The authenticated landing screen for a completed account, for example `/muflah95`. The root authentication flow redirects to the signed-in user's actual username path; it is not the signup or profile-completion screen.

The page uses `multiSessionClient()` to list browser sessions and activate another account. “Add another account” links back to `/?mode=add-account`; the root page treats that query as an explicit add-account flow and bypasses the normal redirect for an already authenticated user. A global client-side session-sync component broadcasts account switches through `BroadcastChannel` with a `localStorage` fallback. The switching tab navigates only after `setActive` succeeds; other tabs refresh when they become visible. This prevents a cross-tab reload from canceling the active tab's session-switch request.

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
