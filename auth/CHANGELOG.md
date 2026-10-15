# Changelog

All notable changes to the authentication implementation are documented here.

## Unreleased

### Added

- Added initial authentication documentation and implementation guidance.
- Added Resend email delivery with generated `no-reply@<domain>` sender addresses.
- Added environment-controlled OTP signup/login (`AUTH_OTP_ENABLED`, enabled by default).
- Added password-reset email links and a reset-password screen.
- Added clear delivery errors for missing or rejected Resend configuration.
- Removed the email-domain fallback; `AUTH_EMAIL_DOMAIN` is now required explicitly, while sender aliases remain application-generated.
- Recorded the successful end-to-end OTP email test and the planned email-first signup/login flow.
- Documented the planned OTP expiry setting and security controls to settle before implementing the new flow.
- Clarified that the target is risk-based OTP: password-only login for trusted devices and password plus OTP for new or risky devices.
- Implemented the email-first signup/login flow with password validation, risk-based OTP, trusted-device support, and server-side signup completion.
- Added `AUTH_OTP_EXPIRES_IN_MINUTES` and `AUTH_OTP_MAX_ATTEMPTS` handling.
- Renamed the provider-specific `RESEND_API_KEY` configuration to provider-neutral `EMAIL_API_KEY`.
- Fixed signup OTP verification so it does not use the login-OTP path or remove an existing credential account.
- Added `docs/RULES.md`, `docs/ARCHITECTURE.md`, and `docs/IMPLEMENTATION.md` for the business rules, system architecture, and technical implementation details.

### Changed

- Clarified that this is a reusable authentication and session-system experiment, not the root website's authentication implementation.
- Defined the initial scope around risk-based OTP, login and signup, account switching, multi-session support, JWTs, and domain-wide cookies from the `auth` subdomain.
- Documented the self-hosted service model, Better Auth integration boundary, standard JSON API, cookie/JWT client paths, unversioned compatibility-first API policy, and rolling-release requirements.
- Documented authorization as a future separate module for roles, permissions, memberships, and policy checks.
- Added placeholder directories for the planned modular-monolith structure, including future authorization and audit modules.
- Clarified that roles, permissions, memberships, and authorization policies belong to consuming applications, not the auth service; removed the authorization module placeholders.
- Added the planned minimal server-rendered HTML/CSS interface for direct visits to the auth subdomain.
- Added the initial Vercel-compatible Better Auth service with PostgreSQL configuration, email/password signup and login, a catch-all auth API route, and a basic test page.
- Added a minimal signed-in screen showing the authenticated user's name and email, with sign-out for repeat testing.
- Recorded the first successful Vercel login test for the vanilla Better Auth baseline.

