# Changelog

All notable changes to the authentication implementation are documented here.

## Unreleased

### Added

- Added the apex site's favicon to the auth service.
- Added Better Auth's official multi-session plugin, environment-controlled session limits, account switching, and an add-account signup entry point.
- Added a stable authenticated root shell with a sidebar account card, in-place account switching, and an add-account popup. Completed users are no longer forced to username routes.
- Added opt-in cross-subdomain session cookies through `AUTH_COOKIE_DOMAIN`, defaulting to host-only cookies when empty.
- Fixed add-account OTP verification so each code is consumed exactly once.
- Renamed the add-account query mode from `sign-up` to `add-account` for clarity.
- Added cross-tab account-switch synchronization. The switching tab navigates after the session switch succeeds; other tabs refresh when they become visible, avoiding canceled switch requests.
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
- Added resumable platform onboarding: OTP verification, password creation, then platform name, username, and date-of-birth profile completion.
- Added `/onboarding` for new and incomplete profiles, and dynamic `/<username>` paths such as `/muflah95` as completed authenticated landing screens.
- Changed the email entry flow to send a neutral OTP before branching to existing-account login or new-account signup, preventing new users from being shown a misleading password screen.
- Routed the initial email OTP request through a server JSON route so delivery failures are handled consistently for new and existing addresses.
- Added resend-OTP actions with a 30-second client cooldown to the email verification and risk-based login screens.
- Added a welcome/account-creation email from `hello@<AUTH_EMAIL_DOMAIN>` after platform profile completion; security emails now use the `auth@` alias.
- Removed the duplicate post-password OTP challenge when the same login already completed email OTP verification.
- Fixed the onboarding guard to require actual platform profile fields, so legacy accounts without a username are redirected to `/onboarding`.
- Kept email, OTP, and password at the root auth URL; authenticated users now go to `/onboarding` when profile setup is incomplete and to their actual username path when it is complete.

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

