# Requirements

This is the Auth unit document. It contains the target product and security requirements together with current implementation status, handoff notes, and requirement progress. Requirements define completion criteria rather than asserting that every item is implemented in the current pilot.

## Product objective

Build a reusable, standalone identity provider and single sign-on service that can be cloned and configured for multiple product platforms without duplicating identity, password, OTP, device, or session logic in every application.

## V1 scope

V1 is the first usable reusable platform. It includes the smallest complete set of capabilities needed for future applications to trust the auth service.

### Included in V1

- Product-neutral user identity with email and password.
- Identifier-first sign-in and signup.
- Verified email ownership.
- Unique public username or handle.
- Password recovery.
- Managed transactional email through Resend.
- Email and OTP verification with expiry, retry, resend, and abuse controls.
- Email OTP after every password login in the current pilot.
- Risk-triggered OTP for new or untrusted clients (deferred).
- Trusted-device recognition with expiry and revocation (deferred).
- Database-backed sessions.
- Active-session listing and individual or global revocation.
- Account switching, add-account, and create-account flows.
- Headless HTTP/JSON APIs.
- Thin hosted authentication and security UI.
- Registered application clients.
- Web SSO for trusted applications.
- Mobile Authorization Code with PKCE.
- Application-local sessions after successful SSO.
- Central logout with application revalidation.
- Email change with verification and password recovery.
- Configuration-driven deployment and product-neutral branding.
- Managed secret handling and basic rotation procedures.
- Structured security events, monitoring, backups, and restore procedures.

### Explicitly deferred beyond V1

- Social login and enterprise federation.
- Passkeys and WebAuthn.
- Public self-service application registration.
- Product-owned organizations, roles, permissions, and billing.
- Arbitrary third-party applications and open platform registration.
- Self-hosted email, SMTP adapters, or application-owned mail transport.
- Signed back-channel logout events and front-channel logout coordination.
- Lost-email recovery, recovery codes, and authenticator-based recovery.
- Custom risk-scoring models beyond documented rules and rate limits.
- Multi-region active-active deployment.
- JWT access tokens for general application APIs unless a V1 consumer requires them.
- Full JWT key inventory, JWKS management, and public token administration.
- Advanced administration dashboards and user impersonation.

Deferred capabilities must not compromise the V1 interfaces or require product-specific code in the reusable core.

## Requirement progress log

Requirement work is recorded here as it is completed or materially changed. Entries use the same timestamp format as the repository `AGENTLOG.md`.

### 2026-10-18T01:55:19+05:00 — Consolidate Auth requirements into the unit document

- Status: Requirements and the implementation handoff are consolidated in this unit document.
- Scope: Established this file as the Auth unit’s requirements and status source.
- Verification: Documentation links and references are being updated as part of this consolidation.

### 2026-10-18T03:27:10+05:00 — Apply password-plus-OTP pilot flow

- Status: Implemented the current pilot authentication flow and documented its boundaries.
- Login: `/login` uses email → password → email OTP → session → validated consuming-app return URL.
- Signup: `/signup` uses email → email OTP verification → password and confirmation → account creation → onboarding.
- Recovery: `/forgot-password` starts the Better Auth password-reset email flow.
- UX: Password fields include accessible show/hide controls; OTP fields support numeric input, one-time-code autofill, paste, resend, and changing the email.
- Deferred: Passkeys, trusted devices, risk-based OTP, TOTP, backup codes, and new session-management behavior.
- Verification: Auth typecheck passes after the flow change.

### 2026-10-18T04:09:36+05:00 — Add signup navigation to login

- Status: Added a signup link to the existing login flow without changing its authentication steps.
- UX: The login screen now offers “Don’t have an account? Sign up”.
- Continuation: The link preserves the validated `returnTo` destination.
- Verification: Auth typecheck passes.

### 2026-10-18T04:31:07+05:00 — Extract reusable onboarding presentation

- Status: Implemented the Auth-maintained `@muflah/onboarding` browser-native package.
- Authority: Auth continues to own onboarding status, username validation, the completion API, and session state.
- Consumers: Auth, Accounts, and Web can render the shared element through configurable API routes; Auth `/onboarding` remains the fallback route.
- Security boundary: No password, OTP, session, cookie, database, or authorization behavior changed.
- Verification: Auth, Accounts, and Web typechecks plus the shared package JavaScript syntax check pass.

## Unversioned rolling-release policy

- All normal API and browser URLs are unversioned.
- Do not introduce `/v1`, `/v2`, version query parameters, or version-specific cookie names.
- Preserve existing routes, request fields, response meanings, and authentication behavior.
- Prefer additive fields, endpoints, configuration, and event types.
- Clients must ignore unknown response fields and safely handle additive enum values where applicable.
- Database changes must use expand-and-contract migrations.
- Old and new service instances must be able to read shared users, sessions, cookies, authorization codes, and event records during deployment.
- New signing keys and secrets require an overlap period with previous versions.
- Deprecations must be documented, measured, and removed only after affected clients have migrated.
- A breaking change requires an explicit compatibility and migration plan, even though the public URL remains unversioned.

## Product and UX rules

### Identity

- Email addresses are normalized consistently before lookup and storage.
- An email address must be verified before it is treated as a fully verified login identifier.
- A username or handle must be unique case-insensitively, normalized to a lowercase canonical value, URL-safe, and checked against reserved names.
- The user-facing `displayUsername` preserves the chosen casing and is maintained separately from the canonical username.
- Users may change their username; Auth owns current-value uniqueness and records retired canonical values for URL compatibility.
- Usernames must not reveal or expose the user's private email address.
- Username changes require an explicit product decision about history, redirects, and impersonation risk.

### Identifier-first authentication

- The first authentication screen asks only for an email address.
- The server normalizes the email before lookup or storage.
- An existing identity continues to sign in; a new identity continues to sign up.
- The user should not be asked for a username before email ownership is verified.
- The flow must avoid revealing more account information than the product's enumeration policy allows.
- If privacy protection is required, the service should return a neutral response and use email verification before branching into sign-in or sign-up.
- The same state-driven flow must work from the main auth screen and from the account switcher.

### Signup and login

- Signup must verify ownership of the email address.
- Email verification alone must not complete onboarding.
- If the user abandons before a password is created, only an expiring pending-signup record may remain; no permanent user account is created.
- After password creation, the account may exist with `onboardingStatus = pending` and `onboardingCompletedAt = null`.
- A pending account must complete the required username setup before receiving product access through SSO.
- The service must redirect an authenticated but incomplete account to `/onboarding` and resume the original application request after completion.
- Store `onboardingStatus` and `onboardingCompletedAt`; do not store a redundant boolean completion field.
- Expose `onboardingComplete` as a derived API value when consuming applications need a simple boolean.
- Send the welcome email only after onboarding is complete.
- The service must not reveal whether an email address already exists through noticeably different error messages.
- Passwords must meet the configured minimum and maximum length requirements.
- The current pilot requires a password and email OTP for every existing-account login.
- Signup verifies email ownership with an OTP before accepting a password and creating the account.
- `/login`, `/signup`, and `/forgot-password` are the explicit hosted entry routes; the root route remains compatible for direct visits and consuming-app handoffs.
- `/start` is a separate neutral identifier entry point; it routes existing emails to `/login` and new emails to `/signup` without changing the existing route UX.
- Risk-based OTP selection and trusted-device suppression are deferred.
- OTP is also required for selected sensitive actions, such as changing email, changing password, disabling security protections, or recovering an account.
- Failed or abusive attempts must be rate-limited by multiple signals, including email, IP, and client context.

### Client recognition

- Trusting a device is optional and must have a visible expiry period.
- Trust must be revocable without requiring the user to revoke every active session.
- The service must never promise that a user will never be asked for OTP again.
- Preferred user-facing wording is: “We will remember this device unless it becomes risky or you revoke access.”
- Device recognition must not rely only on browser fingerprinting.

### Sessions

- Every login creates or maintains a separately revocable session.
- Users can view their active sessions.
- Users can revoke any session except where explicit confirmation is required for revoking the current session.
- Users can revoke all other sessions.
- Users can revoke all sessions as an emergency action.
- Signing out ends the current session.
- Password reset and password change should revoke other sessions by default.
- Expired and revoked sessions must not authenticate requests.

### Account switching

- Switching accounts must be deliberate and visible in the interface.
- The active account must be shown whenever an action could affect account data.
- An account created through the switcher may appear as `Onboarding incomplete` until its username and required setup are finished.
- Selecting an incomplete account must open `/onboarding`; it must not expose the product or present the account as ready.
- Switching must not grant access to an account for which the application has not confirmed membership.
- Signing out of one account must not silently sign out unrelated accounts unless the user chooses “sign out everywhere.”
- The switcher must offer “Add account” or “Create account.”
- The switcher should open from the profile card as a dropdown showing the active account and available accounts.
- “Add account” should open a modal with explicit choices to log in to an existing account or create a new account.
- “Add account” must start the identifier-first email flow.
- A new account must use the normal signup, email verification, username, password, OTP, and trusted-device rules.
- Adding an account must not merge two identities unless a separate, explicit account-linking flow is designed and confirmed.
- The user must see which account is currently active after switching or creating an account.

### Thin hosted UI

- The auth service UI must remain a thin hosted layer, not a product dashboard.
- Product navigation, product data, product feeds, and product-specific settings do not belong in the auth UI.
- The hosted UI must support direct auth visits, consuming-application redirects, OTP entry, recovery, and onboarding. Product account selection, logout, and security-session management belong to the consuming application UI while auth remains authoritative for the underlying state.
- The UI should work with minimal JavaScript and degrade gracefully when practical.
- The UI must be responsive in a desktop browser and a mobile system browser.
- Branding should be configurable without embedding a consuming application's visual design system.
- The initial email screen should have one clear action, such as “Continue.”
- The login screen should provide a clear signup path, such as “Don’t have an account? Sign up”, while preserving the validated continuation target.
- The UI should explain the next step without exposing internal account-state terminology.
- Existing-account and new-account paths should feel like one continuous journey.
- Error messages should help the user recover without exposing account existence, secrets, or internal details.
- OTP entry should support one-time-code autofill on compatible devices.
- Resend actions need a visible cooldown and a clear retry state.
- Loading, expired, invalid, and rate-limited states must be explicit.
- Destructive actions such as “revoke all sessions” require confirmation.
- The current session must be clearly labeled in the session list.
- Users should be able to name or recognize devices without relying on technical identifiers.

## Functional requirements

### Headless access

- Expose authentication through standard HTTP/JSON APIs.
- Support browser clients and native mobile clients.
- Support standards-based application authentication and SSO flows.
- Allow applications to register client identifiers, redirect URIs, trusted origins, and client types.
- Validate authorization requests and reject unregistered redirect destinations.
- Keep product-specific UI outside the auth service.
- Provide predictable success, validation, authentication, authorization, rate-limit, and server-error responses.

### Identity

- Create and authenticate users with email and password.
- Verify email ownership.
- Support a unique public username or handle tied to the user identity.
- Support password recovery.
- Keep email private unless an application explicitly chooses to display it.

### OTP

- Send one-time codes through a configured managed delivery provider.
- Use OTP for email verification, new-device authentication, recovery, and risk-based step-up checks.
- Enforce expiry, one-time use, attempt limits, resend cooldowns, and abuse limits.
- Provide safe, non-enumerating error messages.

### Email connector and templates

- Provide one internal email connector interface for all transactional authentication email.
- Support a Resend adapter for V1.
- Keep the connector extensible for future managed transactional email providers such as SendGrid.
- Do not implement a SendGrid adapter until a consuming application requires it.
- Do not implement an SMTP adapter or self-hosted mail transport.
- Keep provider-specific SDKs and configuration inside adapters.
- Support multiple named templates for verification, sign-in OTP, password reset, security alerts, session events, and future account notifications.
- Support HTML and plain-text variants.
- Use `AUTH_EMAIL_DOMAIN` as the only email-domain configuration value.
- Generate sender aliases in application code from the configured domain and message type.
- Keep sender-alias rules centralized and deterministic; do not add a sender-alias environment variable.
- Support configurable branding, reply-to behavior, and support links where provider and product policy require them.
- Support template variables with validation and safe escaping.
- Support template preview and test delivery in non-production environments.
- Support retries, idempotency, delivery status, provider errors, and operational logging.
- Support provider selection by environment and, where needed, by message type.
- Define explicit fallback behavior when a provider is unavailable.

Email infrastructure and deliverability are delegated to the configured managed provider. The auth service should consume provider delivery status and handle application-level retries and failures without owning mail-server operations.

### Sessions and cross-application logout

- Create separate sessions for separate browsers, devices, and client contexts.
- List active sessions for the authenticated user.
- Show safe session metadata.
- Revoke one selected session.
- Revoke all sessions except the current one.
- Revoke all sessions.
- End sessions on expiry, logout, password reset, and relevant security events.
- Invalidate the central auth session when the user signs out everywhere.
- Require applications to revalidate central session status at login, token exchange, and sensitive actions.
- Support logout of the current application, current central session, and all central sessions.
- Defer signed back-channel and front-channel logout coordination until a consuming application requires it.

### Application registration

- Maintain a registry of consuming applications.
- Support configuration-as-code or operator-controlled registration for the first release.
- Store client type, owner, redirect URIs, trusted origins, post-logout redirect URIs, scopes, and lifecycle status.
- Provide a protected administrative path for future registry management.
- Reject unregistered clients and redirect destinations.
- Do not support public self-service application registration in the first release.
- Every application must have an explicit identifier, display name, owner, and lifecycle status.
- Mobile applications must have an explicit client type and PKCE requirement.
- Applications must not share client secrets with browser code or mobile binaries.

### Email change and account recovery

- Allow a user to request an email change from an authenticated session.
- Require recent authentication and verification of the new email address.
- Notify the old address when possible.
- Document lost-email recovery as a later release; do not automatically replace a verified email in V1.
- Do not replace a verified email based only on a password or an unverified request.
- Recovery must not silently merge identities or transfer account access without clear confirmation and audit records.

### Key management

- Define key and secret management before enabling JWTs.
- Manage cookie, OTP, reset-link, authorization-code, and webhook-signing secrets outside source control.
- Support managed secrets, basic rotation, and safe overlap during rolling deployment.
- Defer full signing-key inventory and JWKS management until JWTs are required.
- Document the owner, purpose, storage location, and rotation procedure for each V1 secret.
- Key values, OTPs, reset tokens, authorization codes, and webhook secrets must never appear in logs.

### Domain-wide web authentication

- Run the service from a stable auth subdomain such as `auth.example.com`.
- Provide seamless SSO for multiple trusted web products.
- Use a central auth-domain session and application-local sessions as the reusable default.
- Optionally support secure parent-domain cookies for explicitly trusted first-party applications.
- Maintain a trusted-origin allowlist.
- Validate all redirect URIs against registered applications.
- Document the security impact of sharing cookies across subdomains.
- Support a reverse-proxy arrangement if browser privacy controls make a direct cross-domain setup unreliable.

### Reusable deployment

- Keep domain names, branding, email providers, application registrations, token issuers, and deployment settings configurable.
- Avoid hard-coded product names, roles, permissions, organizations, or analytics providers.
- Provide a documented clone-and-configure deployment process.
- Separate reusable identity logic from product-specific adapters.

### Configuration variables

The implementation must document and validate these configuration variables. Secret values must never be committed.

| Variable | Purpose | V1 status |
| --- | --- | --- |
| `BETTER_AUTH_SECRET` | Core Better Auth secret material | Required |
| `BETTER_AUTH_URL` | Canonical auth service URL and issuer base | Required |
| `AUTH_COOKIE_DOMAIN` | Optional parent-domain cookie scope | Optional; leave host-only by default |
| `AUTH_TRUSTED_ORIGINS` | Comma-separated full origins allowed to call the auth service | Optional for the host-only pilot; required when additional app origins or SSO are enabled |
| `DATABASE_URL` | PostgreSQL connection | Required |
| `AUTH_EMAIL_DOMAIN` | Verified sender domain used by code to generate sender aliases | Required |
| `EMAIL_API_KEY` | Resend API credential for the initial connector | Required; secret |
| `AUTH_MAX_SESSIONS` | Maximum Better Auth multi-session account-switcher entries per client/device; defaults to `4` when missing or invalid | Optional; defaults to `4` |
| `AUTH_OTP_ENABLED` | Enable OTP workflows | Required |
| `AUTH_OTP_EXPIRES_IN_MINUTES` | OTP lifetime | Required |
| `AUTH_OTP_MAX_ATTEMPTS` | Maximum OTP verification attempts | Required |
| `AUTH_OTP_RESENT_LIMIT` | Maximum OTP resends | Required |
| `AUTH_OTP_RESENT_IN_SECONDS` | Resend cooldown | Required |
| `AUTH_APPLICATIONS_FILE` | Configuration-as-code application registry | Required for SSO |
| `AUTH_BRAND_NAME` | Hosted UI and email brand name | Required |
| `AUTH_SUPPORT_EMAIL` | User support and recovery contact | Required |
| `AUTH_EMAIL_TEMPLATE_DIR` | Managed template source directory | Required when templates are file-based |
| `AUTH_SESSION_EXPIRES_IN_DAYS` | Session inactivity lifetime in days; converted to Better Auth seconds | Optional; defaults to `7` |
| `AUTH_SESSION_UPDATE_AGE_DAYS` | Minimum age in days before active use refreshes session expiry; converted to Better Auth seconds | Optional; defaults to `1` |
| `AUTH_LOGOUT_SIGNING_KEY_REFERENCE` | Secret-manager reference for signed logout events | Deferred with back-channel logout |
| `AUTH_KEY_STORE_REFERENCE` | Secret-manager or KMS reference | Deferred with full key management |
| `AUTH_KEY_ROTATION_INTERVAL_SECONDS` | Key rotation policy | Deferred unless required by the deployment |

## Security requirements

- Use HTTPS in all non-local environments.
- Store secrets only in deployment secret management or ignored local environment files.
- Use HTTP-only, Secure cookies for web sessions.
- Keep CSRF and origin protections enabled.
- Do not store sensitive web session tokens in browser-readable storage.
- Store mobile credentials in platform-secure storage.
- Rate-limit login, signup, OTP, recovery, and session-management operations.
- Keep JWT claims minimal if JWTs are later introduced.
- Define key rotation before enabling independently verified JWTs.
- Record security-relevant events without storing passwords, OTP values, or raw tokens.

## Reliability requirements

- Use PostgreSQL as the initial shared source of truth.
- Support multiple application instances using the same database.
- Use backward-compatible database migrations.
- Define session expiry and renewal behavior explicitly.
- Provide database backup and restore procedures before production use.
- Monitor authentication failures, OTP delivery failures, latency, database errors, and unusual revocation activity.

## Acceptance criteria

The first release is not complete until a user can:

1. Create an account and verify email ownership.
2. Sign in through a web client.
3. Sign in through a mobile client.
4. Receive an OTP challenge on a new or untrusted client.
5. Trust a client for a limited period.
6. See all active sessions.
7. Revoke one other session.
8. Revoke all other sessions.
9. Revoke every session.
10. Change or recover a password and confirm the expected session revocation behavior.
11. Switch between supported accounts without bypassing application authorization.
12. Register a new application with allowed redirect URIs and complete an SSO login.
13. Clone the service configuration for another product platform without changing core identity logic.
14. Sign out across registered applications and verify affected local sessions are invalidated.
15. Change an email address only after the required verification and security checks.
16. Recover an account through an approved recovery factor or controlled support path when the old email is unavailable.
17. Rotate a configured security key during a rolling deployment without breaking valid adjacent-version sessions or flows.

### Pilot web routing policy

- The root route must resolve to the Hosted Auth Screen, onboarding, or a validated consuming-application return target based on active-session state.
- No valid active session shows the Hosted Auth Screen.
- A complete active account returns to the requesting consuming application; direct auth-domain visits may use the compatibility `/<username>` route.
- An incomplete active account opens `/onboarding` and cannot receive product access.
- Consuming-application navigation must not unnecessarily send a valid user to the public auth screen.
- Loading, invalid-session, and session-check failure states must remain distinct.
- A network failure must not be treated as a confirmed logout.
- Account switching, logout, and session revocation must synchronize other tabs.
- Visible tabs refresh immediately; hidden tabs refresh when activated.
- Synchronization events must not contain session tokens or secrets.

For the current pilot, every existing-account login requires password verification followed by email OTP. Signup verifies email ownership before password creation. Trusted-device suppression and risk-based OTP selection are deferred until their persistence and revocation rules are implemented.

## Implementation status and handoff


This file is the working handoff for the reusable authentication service. It records the current implementation truth, deployment assumptions, important decisions, known gaps, and the safest next steps for another agent continuing this work.

## Current objective

Build a reusable identity, authentication, session, account-switching, and SSO service for Muflah and future products. The service owns identity and authentication primitives; consuming applications own organizations, memberships, roles, permissions, billing, and product data. Requirements and implementation status are maintained in this document.

The current implementation is a Better Auth modular monolith in `auth/app`, backed by PostgreSQL and exposed through a thin Next.js hosted UI plus Better Auth’s HTTP/JSON API.

## Technology and boundaries

- Next.js App Router with React and TypeScript.
- Better Auth is the source of truth for passwords, sessions, cookies, OTP capabilities, and multi-session behavior.
- PostgreSQL stores users, accounts, sessions, verification records, and Better Auth-managed state.
- Resend is behind a provider-neutral email connector boundary.
- The hosted UI is intentionally thin and can be replaced by a product-specific web or mobile client later.
- Do not implement parallel password hashing, session-token formats, cookie handling, or OTP primitives.
- Do not add product authorization or application memberships to this service.

## Current deployment/domain model

The real assessment/application host discussed for this project is `labs.automaark.com`. It is a `labs` subdomain, not a `careers` subdomain; “Automaark Careers” is an email sender/display identity only.

The intended shared-domain configuration is:

```env
BETTER_AUTH_URL=https://labs.automaark.com
AUTH_COOKIE_DOMAIN=.automaark.com
AUTH_TRUSTED_ORIGINS=https://automaark.com,https://labs.automaark.com,https://app.automaark.com
```

Use only the origins that are actually trusted. `BETTER_AUTH_URL` is always added automatically to the trusted-origin list. `AUTH_TRUSTED_ORIGINS` is a comma-separated list of full origins, not bare subdomain labels; include the scheme and, for local development, the port.

`AUTH_COOKIE_DOMAIN` is optional. When it is unset, Better Auth uses host-only cookies. When it is set, the runtime enables Better Auth `advanced.crossSubDomainCookies` for that parent domain. A parent-domain cookie is appropriate only when every receiving subdomain is part of the same security boundary.

Cookie sharing and trusted origins are different controls:

1. The cookie domain controls where the browser sends the session cookie.
2. Trusted origins control which browser origins Better Auth accepts for auth requests and mutation/CSRF checks.
3. Cross-subdomain cookie sharing is optional; central SSO with application-local sessions remains the reusable default for unrelated products.

## Configuration

Configuration is loaded from `.env` in the process working directory or its parent directory. In the normal npm workflow this means `auth/.env` or the repository-root `.env`. Never commit a real `.env` file or secret value.

Required or active variables:

| Variable | Meaning |
| --- | --- |
| `BETTER_AUTH_SECRET` | Secret used by Better Auth for signing and security-sensitive state. |
| `BETTER_AUTH_URL` | Canonical auth origin; always included in `trustedOrigins`. |
| `AUTH_COOKIE_DOMAIN` | Optional shared parent-domain cookie scope, for example `.automaark.com`. |
| `AUTH_TRUSTED_ORIGINS` | Optional comma-separated full-origin allowlist. |
| `DATABASE_URL` | PostgreSQL connection string. |
| `AUTH_EMAIL_DOMAIN` | Verified sender domain used to generate sender aliases. |
| `EMAIL_API_KEY` | Resend/provider connector credential. |
| `AUTH_MAX_SESSIONS` | Better Auth multi-session capacity per client/device. Defaults to `4`; missing or invalid values also fall back to `4`. |
| `AUTH_OTP_ENABLED` | Enables OTP workflows unless explicitly set to `false`. |
| `AUTH_OTP_EXPIRES_IN_MINUTES` | OTP lifetime. |
| `AUTH_OTP_MAX_ATTEMPTS` | Maximum OTP verification attempts. |
| `AUTH_OTP_RESENT_LIMIT` | Maximum OTP sends in the configured window. |
| `AUTH_OTP_RESENT_IN_SECONDS` | OTP resend rate-limit window. |

`AUTH_APPLICATIONS_FILE` and related application-registry settings appear in the product requirements, but application registration, OAuth/SSO callbacks, and client registry are not yet implemented in the current pilot.

## Implemented web behavior

The root route resolves the current state:

```text
No valid active session  -> Hosted Auth Screen
Incomplete account       -> /onboarding
Complete account         -> /<username> compatibility account route or consuming-app return target
```

The Hosted Auth Screen is a thin authentication surface. Consuming applications such as `accounts/` own the account home, profile/settings UI, and product shell. Auth maintains the reusable account-switcher implementation, delivered as the framework-neutral `@muflah/account-switcher` web component from the shared root `packages/account-switcher` package. Accounts, Web, and Auth compatibility pages mount the same component; Auth remains authoritative for all APIs and session behavior. They start auth with a validated `returnTo` URL; auth returns to that target after login, signup, verification, or onboarding. An explicit `intent=login` is used for add-account flows so an existing active session does not short-circuit the flow.

Existing active sessions are honored when the auth site is opened in a new tab. The shared account switcher uses `BroadcastChannel` with a `storage` fallback for same-origin notifications and revalidates the Auth session when a consuming-app tab becomes visible, receives focus, or returns from the browser back/forward cache. Account changes dispatch a non-sensitive `muflah:active-account-changed` event; consuming apps update their UI without a hard reload. Events contain only event type, ID, and timestamp; they never contain session tokens.

## Authentication flows

- Identifier-first email lookup.
- Existing-account login verifies the password, sends a sign-in OTP, and creates the session only after the OTP succeeds.
- Signup verifies the email first, then creates the password-backed account and routes to onboarding.
- Onboarding collects the username and marks the account complete.
- Complete accounts route to `/<username>`.
- Incomplete accounts route to `/onboarding` and must not receive product access.
- Username is mutable after onboarding through the configured Better Auth username plugin; canonical casing remains lowercase while `displayUsername` preserves formatting.

## Multi-account and logout behavior

Better Auth’s `multiSession` plugin stores additional account sessions in signed multi-session cookies. The account switcher reads `/multi-session/list-device-sessions` and activates a selected session through `/multi-session/set-active`.

The session capacity is configured with:

```ts
multiSession({ maximumSessions: config.maxSessions })
```

The account-shell logout action must remain account-specific. It sends the current session token to:

```text
POST /api/auth/multi-session/revoke
{ "sessionToken": "..." }
```

It deliberately does not call `/api/auth/sign-out`. Better Auth’s global sign-out behavior clears all multi-session cookies on the client, which would log out unrelated switched accounts. After revocation, Better Auth can activate another remaining account session and the root resolver handles the next route.

The security page filters the visible session list by the selected user ID. Individual session revocation uses Better Auth’s multi-session revoke endpoint. Global revoke/everywhere behavior remains a separate destructive operation and must not be accidentally reused for account-switcher logout.

## Important implementation files

| File | Responsibility |
| --- | --- |
| `app/src/lib/auth.ts` | Single Better Auth configuration, plugins, trusted origins, and cross-subdomain cookie setup. |
| `app/src/lib/config.ts` | Environment loading, strict integer parsing, trusted-origin parsing, and runtime defaults. |
| `app/src/app/api/auth/[...all]/route.ts` | Forwards Better Auth endpoints through Next.js. |
| `app/src/app/page.tsx` | Thin hosted auth screen, return-target handoff, and active-session/root resolver. |
| `app/src/app/[username]/page.tsx` | Complete-account home shell. |
| `app/src/app/security/sessions/page.tsx` | Selected-account security/session view. |
| `app/src/components/auth/account-actions.tsx` | Selected-account logout. |
| `app/src/components/auth/session-list.tsx` | Individual session revocation UI. |
| `app/src/components/auth/account-switcher-element.tsx` | Auth compatibility-page wrapper for the shared account switcher. |
| `packages/account-switcher/src/account-switcher.js` | Framework-neutral account switcher web component maintained by Auth and shared across products. |
| `app/src/components/auth/onboarding-element.tsx` | Auth compatibility-page wrapper for the shared onboarding element and validated return target. |
| `packages/onboarding/src/onboarding.js` | Framework-neutral onboarding presentation maintained by Auth and shared across products. |
| `app/src/app/onboarding/page.tsx` | Incomplete-account onboarding UI. |
| `app/src/app/api/onboarding/complete/route.ts` | Onboarding completion and username persistence. |
| `app/src/app/api/profile/username/route.ts` | Authenticated mutable username changes. |
| `app/migrations/001_username_aliases.sql` | Retired username alias table for URL compatibility. |
| `app/src/app/api/identity/lookup/route.ts` | Identifier-first account lookup. |

## Mobile client status

The architecture and requirements call for mobile Authorization Code with PKCE, system-browser authentication, and secure OS credential storage. That flow is not complete in the current codebase. The planned Expo pilot is documented in [`units/MOBILE.md`](MOBILE.md), [`mobile/docs/ARCHITECTURE.md`](../mobile/docs/ARCHITECTURE.md), and [`mobile/docs/IMPLEMENTATION.md`](../mobile/docs/IMPLEMENTATION.md).

What exists today can be consumed as HTTP/JSON where the client can safely manage the required session transport, but there is no completed native mobile client contract yet. Do not make a mobile app depend on browser cookies or `AUTH_COOKIE_DOMAIN`.

Still required for production mobile support:

- Application/client registration.
- Redirect URI and deep-link/universal-link validation.
- Authorization Code + PKCE endpoints and token exchange.
- Clear bearer/refresh-token or equivalent mobile credential strategy.
- Secure storage guidance for iOS and Android.
- Mobile integration tests, including OTP and session revocation.

## SSO and application integration status

The reusable design is central auth plus application-local sessions. A consuming web app should authenticate through the auth service, validate the returned central session/token, and create its own host-only local session. A mobile app should use PKCE rather than copying browser cookies.

Reference-application SSO callbacks, application registry, client credentials, redirect URI persistence, token exchange, signed back-channel logout, and front-channel logout are not complete. Do not claim end-to-end SSO support until those boundaries and a real consuming application are tested.

The delivery sequence is deliberate:

1. Build and test a separate web application against the auth service first.
2. Validate application registration, trusted origins, redirect URIs, SSO, local application sessions, logout, and session revalidation end to end.
3. Only after the web integration is stable, add the separate native mobile client using Authorization Code + PKCE.

Mobile implementation must not begin by copying the web cookie model into the app.

## Known gaps and cautions

- `AUTH_TRUSTED_ORIGINS` must be configured with only approved origins in production.
- A broad `.automaark.com` cookie exposes the session to every receiving subdomain; do not enable it for untrusted or independently operated subdomains.
- The email sender/display name does not determine the auth domain. The application URL is the source of truth.
- Do not use global `/sign-out` for account-switcher logout.
- Do not add `identify`, `people.set`, or `reset` to Mixpanel; the main project instructions require anonymous tracking only.
- Trusted-device persistence is not fully implemented.
- Real email-delivery verification and a fully staged pre-account signup record remain incomplete.
- Application authorization remains outside this service.

## Verification and continuation checklist

From `auth/`, run:

```powershell
npm run typecheck
npm run build
git diff --check
```

Before changing auth behavior, inspect the Better Auth version in `package.json` and its installed plugin behavior. Prefer official Better Auth endpoints and configuration over custom session logic.

Before production deployment:

1. Set `BETTER_AUTH_URL` to the actual canonical auth origin.
2. Decide whether host-only cookies or a trusted parent-domain cookie is appropriate.
3. If sharing cookies, set `AUTH_COOKIE_DOMAIN` and enumerate all approved origins in `AUTH_TRUSTED_ORIGINS`.
4. Configure PostgreSQL and email credentials in the deployment secret manager.
5. Run the schema check/migration process against the intended database.
6. Test account switching, selected-account logout, individual revocation, cross-tab refresh, and session-limit behavior.
7. Do not mark mobile or reference-application SSO complete without an end-to-end client test.

## Source documentation

- `auth/README.md` — service overview, configuration, routing, and current pilot status.
- `auth/docs/ARCHITECTURE.md` — system boundaries and long-term identity/SSO model.
- `auth/docs/IMPLEMENTATION.md` — implementation rules, endpoints, and test plan.
- `AUTH.md` — Auth unit requirements, implementation status, and handoff.
- `../RELEASE.md` — repository-level release notes, scope, and closure criteria.
- `../AGENTLOG.md` — repository-wide chronological change history.
