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

AUTH_EMAIL_DOMAIN=mail.muflah.com
EMAIL_API_KEY=...

AUTH_OTP_ENABLED=true
AUTH_OTP_EXPIRES_IN_MINUTES=3
AUTH_OTP_MAX_ATTEMPTS=3
```

`AUTH_EMAIL_DOMAIN` and `EMAIL_API_KEY` are required for email delivery. There is no apex-domain or `BETTER_AUTH_URL` fallback. `EMAIL_API_KEY` is provider-neutral naming; the current implementation still uses the Resend adapter.

## Better Auth configuration

The service enables:

- `emailAndPassword` for credential authentication and password reset links.
- `emailOTP` for signup email verification.
- `twoFactor` with email OTP for login step-up verification.
- Signed trusted-device cookies with a 30-day lifetime.

OTP settings are read from the environment. Better Auth receives the email OTP lifetime in seconds, so the application converts the configured minute value.

## Important routes

```text
GET/POST /api/auth/[...all]
```

The standard Better Auth JSON API, including sessions, password login, password reset, email OTP, and two-factor endpoints.

```text
POST /api/auth-flow/verify-signup-otp
```

Signup-specific OTP verification. For an existing user, it verifies email ownership before allowing the login-OTP endpoint to run, preserving existing credential accounts.

```text
POST /api/auth-flow/finish-signup
```

Completes a verified signup by validating the password, updating the user name, creating the credential password, and enabling email OTP two-factor protection.

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
- Session listing, explicit trusted-device revocation, account switching, JWT issuance, and JWKS remain planned modules.
