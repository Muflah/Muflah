# Requirements

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
- Risk-triggered OTP for new or untrusted clients.
- Trusted-device recognition with expiry and revocation.
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
- A username or handle must be unique, normalized, URL-safe, and checked against reserved names.
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
- A known, low-risk client may sign in without OTP after satisfying the primary authentication requirement.
- A new, unknown, or risky client must complete an OTP challenge.
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
- The hosted UI must support direct auth visits, SSO redirects, account selection, OTP entry, recovery, logout, and security-session management.
- The UI should work with minimal JavaScript and degrade gracefully when practical.
- The UI must be responsive in a desktop browser and a mobile system browser.
- Branding should be configurable without embedding a consuming application's visual design system.
- The initial email screen should have one clear action, such as “Continue.”
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
| `DATABASE_URL` | PostgreSQL connection | Required |
| `AUTH_EMAIL_DOMAIN` | Verified sender domain used by code to generate sender aliases | Required |
| `EMAIL_API_KEY` | Resend API credential for the initial connector | Required; secret |
| `AUTH_MAX_SESSIONS` | Maximum sessions per client or configured policy | Required |
| `AUTH_OTP_ENABLED` | Enable OTP workflows | Required |
| `AUTH_OTP_EXPIRES_IN_MINUTES` | OTP lifetime | Required |
| `AUTH_OTP_MAX_ATTEMPTS` | Maximum OTP verification attempts | Required |
| `AUTH_OTP_RESENT_LIMIT` | Maximum OTP resends | Required |
| `AUTH_OTP_RESENT_IN_SECONDS` | Resend cooldown | Required |
| `AUTH_TRUSTED_ORIGINS` | Allowed application origins | Required for SSO |
| `AUTH_APPLICATIONS_FILE` | Configuration-as-code application registry | Required for SSO |
| `AUTH_BRAND_NAME` | Hosted UI and email brand name | Required |
| `AUTH_SUPPORT_EMAIL` | User support and recovery contact | Required |
| `AUTH_EMAIL_TEMPLATE_DIR` | Managed template source directory | Required when templates are file-based |
| `AUTH_SESSION_EXPIRES_IN_SECONDS` | Session lifetime | Required when explicitly configured |
| `AUTH_SESSION_UPDATE_AGE_SECONDS` | Session renewal interval | Required when explicitly configured |
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
