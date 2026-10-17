# Release Plan

This is a roadmap and closure-criteria document. Its MVP/V1 sections describe target milestones, not the current pilot’s shipped capability set. See `../../AUTH.md` for current status.

## Purpose

This document defines what each release must deliver, what is deliberately deferred, and what evidence is required before a release is considered complete.

The auth service uses rolling releases and unversioned public URLs. “MVP”, “V1”, and later release names describe delivery milestones, not API versions. Public routes, cookies, event contracts, and API meanings must not be renamed merely because the deployment milestone changes.

## Release principles

- The auth service remains reusable and product-neutral.
- Every release must be deployable independently and safely alongside the previous release.
- New behavior is added compatibly before old behavior is removed.
- No `/v1` or `/v2` URL prefixes.
- No version query parameters or version-specific cookie names.
- A release is closed only when its acceptance criteria, security checks, operational checks, and documentation are complete.

## MVP: prove the core identity loop

The MVP proves that one real application can use the auth service successfully.

### MVP capabilities

- PostgreSQL-backed identity and sessions.
- Email/password signup and sign-in.
- Identifier-first email journey.
- Email verification through Resend.
- Password recovery.
- Unique username or handle.
- Email OTP for verification and new or untrusted clients.
- OTP expiry, attempt limits, resend cooldowns, and rate limits.
- Trusted-device recognition with a finite expiry.
- Active-session listing and individual or global revocation.
- Multi-session support on one browser or mobile client.
- Add-account and create-account flows.
- Thin hosted auth UI.
- Headless HTTP/JSON API.
- One registered reference web application.
- Basic web SSO and application-local session creation.
- Mobile-compatible Authorization Code with PKCE flow.
- Current-session and sign-out-everywhere behavior.
- Configuration-driven application registration.
- Resend-only email connector with reusable templates.
- Basic security logging, backups, and deployment configuration.

### MVP exclusions

- SendGrid adapter.
- Public application-registration API.
- Social login, enterprise federation, and passkeys.
- TOTP authenticator applications.
- General JWT access tokens.
- Product organizations, roles, permissions, and billing.
- Automated lost-email recovery.
- Self-hosted email or SMTP support.
- Multi-region active-active deployment.

### MVP closure criteria

The MVP is closed only when all of the following are true:

- A clean deployment can be configured from documented environment variables.
- A new user can sign up, verify email, choose a username, and reach the reference application.
- An existing user can sign in through the identifier-first flow.
- A new client receives OTP and can be trusted for the configured period.
- One client can hold and switch between multiple sessions.
- Users can list and revoke sessions.
- Password recovery works and revokes the required sessions.
- The reference application can complete SSO without a second login.
- The mobile PKCE flow has an automated or reproducible integration test.
- Resend delivery, failures, retries, and rate limits are observable.
- Logout and emergency revocation behavior has been tested.
- Security, accessibility, rollback, backup, and restore checks pass.

## V1: reusable identity platform

V1 expands the MVP into the reusable platform intended to be cloned for multiple product families.

### V1 capabilities

- Multiple registered web and mobile applications.
- Application registry with owners, client types, redirect URIs, trusted origins, scopes, and lifecycle status.
- Standards-based SSO authorization and token exchange.
- Host-only application sessions by default.
- Optional parent-domain cookies for explicitly trusted first-party applications.
- Central logout with application revalidation at login, token exchange, and sensitive actions.
- Account switching across registered applications.
- Email change with verification and old-address notification.
- Normal email change with verification of the new address.
- Provider-neutral email connector boundary with Resend as the initial provider.
- Versioned email templates and normalized delivery events.
- Managed application secrets and basic rotation procedures.
- Configuration-driven branding, support links, and deployment settings.
- Rolling-release compatibility tests with old and new instances running together.
- Structured audit and security events.

### V1 closure criteria

V1 is closed only when:

- Two independent reference applications can use the same auth deployment.
- A user can sign in once and move between both applications without another login.
- Application registration rejects unknown clients and invalid redirect destinations.
- Central logout invalidates the central session and applications revalidate before granting sensitive access.
- Session listing and revocation work across web and mobile clients.
- Email changes and password recovery follow the documented rules.
- Managed secret rotation works during a rolling deployment without invalidating valid adjacent-version flows.
- Database migrations are backward-compatible across the deployment overlap.
- The clone-and-configure process works without editing core identity code.
- Security, abuse, accessibility, reliability, backup, restore, and rollback criteria pass.
- Documentation, operational runbooks, and acceptance evidence are complete.

## V1 and later

Later releases may add capabilities when a real consuming application requires them and the related security and UX policies are documented first.

Candidate capabilities include:

- SendGrid and other managed email providers.
- Signed back-channel logout events and front-channel logout coordination.
- Lost-email recovery, recovery codes, and authenticator-based recovery.
- JWT access tokens, JWKS, and full signing-key inventory.
- Protected application-registration API and administration tooling.
- TOTP authenticator applications.
- Passkeys and WebAuthn.
- Social login and enterprise federation.
- Public or administrative application-registration APIs.
- Organization and workspace primitives, if deliberately moved into the auth service.
- Administrative dashboards and support tooling.
- More advanced risk evaluation.
- Multi-region availability.

## Configuration inventory

The current local `.env` contains these variables:

```text
BETTER_AUTH_SECRET
BETTER_AUTH_URL
AUTH_COOKIE_DOMAIN
DATABASE_URL
AUTH_EMAIL_DOMAIN
AUTH_MAX_SESSIONS
EMAIL_API_KEY
AUTH_OTP_ENABLED
AUTH_OTP_EXPIRES_IN_MINUTES
AUTH_OTP_MAX_ATTEMPTS
AUTH_OTP_RESENT_LIMIT
AUTH_OTP_RESENT_IN_SECONDS
```

The V1 implementation should additionally define names and ownership for application registration, trusted origins, session policy, branding, template configuration, and managed secrets. Logout signing and full key-rotation variables are deferred with back-channel logout and JWT capabilities. Secret values must never be committed or copied into this document.

## Pilot web acceptance notes

The pilot web experience is accepted only when:

- The root route shows the Hosted Auth Screen only when no valid active session exists.
- A valid complete account opens the Account Shell at `/<username>`.
- An incomplete account opens `/onboarding` and cannot access the product shell.
- The Account Shell account switcher opens login/signup inside a modal.
- Existing-account login requires email OTP on every login.
- Available accounts can be selected through Better Auth multi-session state.
- Security sessions are scoped to the selected account.
- Logging out removes the selected account while preserving other account sessions.
- Visible browser tabs refresh after account changes, logout, or session revocation.
- Hidden tabs refresh when they become active.
