# Implementation

This document combines current implementation rules with the planned V1 integration boundary. Current pilot behavior, known gaps, and requirements are summarized in `../../units/AUTH.md`; roadmap statements below are not claims that every V1 capability is already shipped.

## Better Auth usage

Use Better Auth as the authentication engine and use its official capabilities where they match the requirements. Do not build parallel password hashing, session, OTP, cookie, or token implementations.

The current pilot and planned integrations are:

- Core Better Auth configuration.
- Email and password authentication.
- Email verification and password recovery.
- Username support.
- Multi-session support.
- Password followed by email OTP on every login attempt in the current pilot policy.
- Two-factor or OTP support.
- Trusted-device support.
- Standard session listing and revocation.
- Bearer authentication for mobile or API clients.
- JWT support only for external services that need independently verifiable tokens.

## Implementation-oriented folder structure

The implementation should follow the repository boundaries defined in `ARCHITECTURE.md`:

The top-level `auth/` directory is a documentation and hosted-service container. The hosted service implementation lives under `auth/app/`. The Auth-maintained framework-neutral account switcher lives in the shared root package `packages/account-switcher` and is deliberately independent of React and Next.js. Auth compatibility pages mount it through `auth/app/src/components/auth/account-switcher-element.tsx`; the local `/auth-api` rewrite maps the component’s browser calls to Auth’s `/api/auth` endpoints. `package.json` and its lockfile are the deliberate exceptions because they define the dependency graph and project commands. Other supporting files such as TypeScript files, framework configuration, application-registration JSON, migrations, and tests remain inside `auth/app/`.

| Area | Responsibility | Must not contain |
| --- | --- | --- |
| `src/app` | Thin hosted auth screens and stable route handlers | Product dashboards, product navigation, product permissions |
| `src/app/api/auth/[...all]` | The single Better Auth HTTP boundary | A second custom authentication server |
| `src/lib/auth.ts` | The single Better Auth server configuration | Duplicated password, session, cookie, or OTP implementations |
| `src/lib/auth-client.ts` | Browser/client calls and UI-facing helpers | Server secrets or database access |
| `src/lib/config.ts` | Environment parsing and startup validation | Hard-coded deployment secrets |
| `src/lib/database.ts` | Database pool and persistence setup | Product-specific data access |
| `src/lib/email` | Provider-neutral email interface, Resend adapter, aliases, templates | SMTP, self-hosted mail transport, provider-specific logic spread through routes |
| `src/lib/applications` | Registered clients, redirect URIs, trusted origins, client validation | Product organizations, roles, memberships, or billing |
| `src/lib/security` | Security policy, secret references, and security event helpers | Ad hoc security decisions inside UI components |
| `config` | Deployment-safe examples and client configuration inputs | Secret values |
| `migrations` | Expand-and-contract database changes | Destructive migration assumptions during rolling deploys |
| `tests` | Unit, integration, contract, and end-to-end verification | Tests that depend on one product's private implementation |

The first-level layout is therefore:

```text
auth/
├── .env
├── package.json
├── package-lock.json
├── docs/
└── app/
    ├── config/
    ├── migrations/
    ├── src/
    └── tests/
```

Only the deployment `.env` and Auth documentation belong directly under `auth/`. The repository-level `AGENTLOG.md` and `CHANGELOG.md` live at the workspace root. The `.env.example` belongs under `auth/app/` beside the implementation project so it documents the runnable application without adding another top-level project file.

### Node project manifests

The root manifests have different purposes:

- `auth/package.json` declares the auth application's direct dependencies and standard commands such as development, build, start, type checking, migration, and tests.
- `auth/package-lock.json` records the exact dependency tree installed from `package.json`, including transitive dependency versions and integrity checksums.

The lockfile is generated and updated by npm. It must be committed so local development, CI, deployment, and future clones resolve the same dependency tree. It should not be edited manually, and it must not contain secrets.

### Build order

The first vertical slice should be implemented in this order:

1. Validate the existing environment contract and establish the database connection.
2. Create one Better Auth server instance and its database schema.
3. Add the identifier-first email entry and verification journey.
4. Add the thin auth screen and validate the first consuming account UI (`accounts/`) through the redirect handoff.
5. Add the Resend connector and code-generated sender aliases.
6. Add application registration and the SSO redirect/callback boundary without assuming a reference application yet.
7. Add contract and end-to-end tests for the stable, unversioned flows.

Do not create separate `accounts`, `otp`, `tokens`, `cookies`, or `risk` services at the beginning. Those concerns are Better Auth responsibilities in V1. Add an extension only when the requirement cannot be met through the configured Better Auth capability and the extension has a documented contract and test.

The absence of a first reference application does not block the reusable auth core. It does postpone final callback URLs, client credentials, and an end-to-end SSO acceptance test for a real consuming product.

Integration order is web first, mobile second: validate a separate web reference application and its application-local session boundary before implementing the native mobile Authorization Code + PKCE client. The planned Expo pilot is documented in [`units/MOBILE.md`](../../units/MOBILE.md) and [`mobile/docs/IMPLEMENTATION.md`](../../mobile/docs/IMPLEMENTATION.md).

## V1 implementation boundary

V1 should implement the reusable identity platform needed by the first consuming applications:

- Email/password identity.
- Identifier-first signup and sign-in.
- Email verification, password recovery, and email change.
- OTP, trusted devices, and abuse controls.
- Database-backed sessions with listing and revocation.
- Account switching and add-account flows.
- Thin hosted UI and headless HTTP/JSON APIs.
- Registered applications, web SSO, and mobile PKCE.
- Application-local sessions and central logout with application revalidation.
- Managed Resend email adapter with a provider-neutral connector boundary.
- Product-neutral configuration, managed secrets, logs, and operations.

Do not pull deferred capabilities into V1 merely because Better Auth offers a plugin for them. Add a capability only when it has a documented consumer, UX, security policy, and acceptance test.

## Configuration variables

The current local environment uses these names:

```text
BETTER_AUTH_SECRET
BETTER_AUTH_URL
AUTH_COOKIE_DOMAIN
AUTH_TRUSTED_ORIGINS
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

`AUTH_MAX_SESSIONS` is the Better Auth multi-session limit used by the account switcher. The runtime default is `4`, and missing or invalid values fall back to `4`.

`BETTER_AUTH_URL` is the canonical auth origin and is always trusted. `AUTH_TRUSTED_ORIGINS` accepts a comma-separated list of full origins, such as `https://app.example.com,https://admin.example.com`. When `AUTH_COOKIE_DOMAIN` is set to a shared parent domain, the runtime enables Better Auth `crossSubDomainCookies` for that domain.

For V1, add and document these configuration names before implementing the corresponding features:

```text
AUTH_TRUSTED_ORIGINS
AUTH_APPLICATIONS_FILE
AUTH_BRAND_NAME
AUTH_SUPPORT_EMAIL
AUTH_EMAIL_TEMPLATE_DIR
AUTH_SESSION_EXPIRES_IN_SECONDS
AUTH_SESSION_UPDATE_AGE_SECONDS
AUTH_LOGOUT_SIGNING_KEY_REFERENCE
AUTH_KEY_STORE_REFERENCE
AUTH_KEY_ROTATION_INTERVAL_SECONDS
```

Configuration rules:

- Keep secret values outside source control.
- Use `BETTER_AUTH_URL` as the canonical auth origin and issuer base unless a separate issuer is explicitly required.
- Leave `AUTH_COOKIE_DOMAIN` unset for host-only cookies unless the deployment deliberately trusts the parent domain.
- Keep the initial email connector mapped to Resend through `EMAIL_API_KEY`.
- Use `AUTH_EMAIL_DOMAIN` only as the verified domain input for code-generated sender aliases.
- Generate `hello@<AUTH_EMAIL_DOMAIN>` for welcome, signup verification, password recovery, and security messages.
- Generate `noreply@<AUTH_EMAIL_DOMAIN>` for OTP messages.
- Send the welcome email only after onboarding is complete, not merely when the account row is created.
- Do not introduce a sender-alias environment variable.
- Validate required variables at startup and fail clearly for unsafe or incomplete production configuration.
- Document whether each variable is required, optional, secret, reloadable, or deployment-restart-only.

## Unversioned API and rolling-release implementation

Use stable, unversioned routes and identifiers. Do not encode release versions in URL paths, query parameters, cookie names, event names, or client package assumptions.

Every change must be checked against a two-instance deployment where the old and new versions run at the same time. In particular:

- Add database columns before reading or requiring them.
- Deploy readers before writers when introducing new fields.
- Keep old fields and routes working during the transition.
- Make event consumers ignore unknown fields and safely deduplicate event IDs.
- Keep cookies and sessions readable across the deployment overlap.
- Keep authorization codes valid for their intended lifetime. Signed logout events are deferred beyond V1.
- Rotate keys with active and previous versions available simultaneously.
- Remove deprecated behavior only after usage has been measured and clients have migrated.

Use expand-and-contract migrations. A breaking contract must be handled as a coordinated migration with compatibility behavior, not by silently changing an existing unversioned route.

## Reusable identity-provider implementation

Treat this repository as a standalone identity provider, not as an authentication page embedded inside one product.

The implementation should have a product-neutral core and configuration-driven integrations for:

- Auth service URL and issuer.
- Brand name and user-facing copy.
- Database connection.
- Email and SMS providers.
- Registered applications.
- Redirect URI allowlists.
- Trusted origins.
- Cookie policy.
- Token and key policy.
- Logging and monitoring destinations.

Do not hard-code Muflah product names, product roles, product permissions, product account models, or product analytics into the reusable core.

## Email connector and template implementation

Define a provider-neutral interface similar to:

```text
sendTransactionalEmail({
  messageType,
  recipient,
  variables,
  locale,
  idempotencyKey,
})
```

The connector is responsible for selecting and rendering the template, generating the sender alias from `AUTH_EMAIL_DOMAIN` and the message type, applying provider configuration, submitting the message, recording the provider result, and returning a normalized outcome. Authentication code should only request a message type and its validated variables.

Sender aliases are code-owned behavior. The implementation may map message types to aliases such as `security`, `verify`, or `no-reply`, then combine the selected alias with `AUTH_EMAIL_DOMAIN`. The exact alias map belongs in code and must not be supplied through a sender-alias environment variable.

Initial adapter:

- Resend API.

Future adapters may support other managed transactional email APIs such as SendGrid. SMTP submission, SMTP relays, self-hosted mail servers, and application-owned mail transport are explicitly out of scope.

Recommended message types include:

```text
email_verification
sign_in_otp
password_reset
security_alert
new_session
session_revoked
```

Each template should support:

- Stable template key and version.
- Plain-text body.
- HTML body.
- Required variable schema.
- Subject template.
- Locale.
- Product/platform branding configuration.
- Preview and test-render support.

Do not place raw OTP values, password-reset secrets, or provider credentials in logs. Links should contain short-lived, single-use tokens and should point to an approved auth host.

## Delivery reliability

Email sending should be resilient to transient provider failures. The implementation should define:

- Timeout behavior.
- Retry policy with bounded exponential backoff.
- Idempotency handling to prevent duplicate security messages.
- Provider rate-limit handling.
- Permanent versus temporary failure classification.
- Delivery, bounce, complaint, and suppression events.
- Operational alerts for delivery degradation.

For V1, Resend is the supported production provider. Provider-specific deliverability infrastructure remains the provider's responsibility. The auth service should monitor delivery results and handle application-level retries, but it should not operate mail transport, SMTP infrastructure, DNS reputation, or an outbound mail queue.

## Thin hosted UI implementation

The hosted UI should be a small set of server-rendered or minimally enhanced pages that call the same auth APIs used by external clients. It should not become a second authentication implementation.

Current hosted routes and screens:

```text
/                         identifier-first compatibility entry
/login                    email → password → email OTP login
/signup                   email → email OTP → password and confirmation signup
/account                  account selection and switching
/security/sessions        active sessions and revocation
/forgot-password          password recovery request
/reset-password           password recovery completion
/logout                   sign-out result
/error                    safe error and expired-flow states
```

The auth UI is a protocol companion, not the product account dashboard. Consuming applications start it with a trusted `returnTo` URL. The auth screen completes login, signup, verification, password recovery, or onboarding and then returns to that URL. The accounts app owns the account overview, profile/settings presentation, and active-session UI while Auth owns the reusable framework-neutral account switcher and remains authoritative for all state changes.

The root route remains compatible for direct visits and consuming-app handoffs. The current pilot does not implement passkeys, trusted-device suppression, risk-based OTP, TOTP, or backup codes.

The hosted UI must:

- Use the same server-side state machine as web, mobile, and product SDK clients.
- Bind redirect and continuation state to the registered application and authorization request.
- Never trust a browser-supplied “existing account” or “signup” flag.
- Avoid exposing raw session tokens, OTP values, client secrets, or internal error details.
- Provide clear loading, retry, expiry, and rate-limit states.
- Support accessible labels, keyboard navigation, focus management, and one-time-code autofill where available.
- Allow configuration of platform name, logo, colors, legal links, help links, and support contact without product-specific code.

The UI should be intentionally small enough that a consuming product can replace it later with its own branded screens while continuing to use the same headless APIs and SSO protocol.

## SSO and application integration

The preferred web integration is central SSO with application-local sessions:

1. The application starts an authorization request with its registered client identifier.
2. The auth service validates the client, redirect URI, requested parameters, and state.
3. The auth service authenticates the user or reuses the central auth session.
4. The auth service returns a short-lived, single-use authorization result.
5. The application exchanges the result server-to-server.
6. The application creates a host-only local session.
7. The application fetches identity and applies its own authorization rules.

Browser code must never receive an application client secret. Authorization codes must be short-lived, single-use, bound to the intended client, and protected against replay.

Mobile applications should use Authorization Code with PKCE. They should use the system browser or platform authentication session so a central web login can be reused without copying browser cookies into the app.

The service may support a shared parent-domain cookie for explicitly trusted first-party products, but this should be an opt-in deployment mode. The reusable protocol and application-registration model must work without it.

## V1 logout implementation

V1 central logout should:

1. Revoke the central Better Auth session or sessions.
2. End the current local application session when the user is signing out of that application.
3. Require applications to revalidate central session status at login, token exchange, and sensitive actions.

Signed back-channel logout events and front-channel logout coordination are deferred beyond V1. When added later, the event should contain an event identifier, issuer, affected user or session reference, audience application, issued time, and expiry. It must not contain raw session tokens.

Applications should revalidate central session status at login, token exchange, and other security-sensitive boundaries so a missed notification cannot create indefinite access.

The V1 logout API must define whether it ends:

- The current local application session.
- The current central auth session.
- All central sessions.
- Application sessions are invalidated when they revalidate the central session; signed propagation is deferred beyond V1.

## Application registry implementation

Use a registry backed by configuration-as-code or an operator-controlled administrative command for the first release. Keep the data model ready for a protected administrative API later.

Minimum application record:

```text
client_id
display_name
owner_reference
client_type
redirect_uris
post_logout_redirect_uris
trusted_origins
allowed_scopes
pkce_required
confidential_client_secret_hash or key reference
status
created_at
updated_at
```

Registration changes require audit records. Redirect URI validation must use the stored registration and must fail closed when a client is unknown, disabled, or misconfigured.

## Email change and recovery implementation

Use a pending-change record rather than changing the primary email immediately:

```text
current_email
pending_email
requested_by_session
new_email_verification_id
created_at
expires_at
completed_at
```

The normal flow is recent authentication, request the new address, verify the new address, notify the old address, revoke or review affected sessions as required, and commit the change atomically.

V1 does not automatically replace a verified email when the old address is unavailable. Lost-email recovery, recovery codes, authenticator factors, and controlled manual support review are deferred until a later release has a documented evidence and audit process.

Do not create an automatic email replacement path based only on a password. An email replacement can transfer account control.

## V1 secret-management implementation

V1 should maintain managed secret configuration for the core auth service:

```text
secret_name
purpose
storage_reference
rotation_owner
last_rotated_at
next_rotation_at
```

At minimum, track separate purposes for the Better Auth secret, OTP and verification state, reset links, authorization-code state, and future logout signing. Full signing-key inventory, JWKS management, and JWT key administration are deferred until independently verified JWTs are required.

Use a deployment secret manager or KMS. Support safe rotation and overlap during rolling deployment, and define how emergency revocation invalidates affected sessions, codes, links, or signatures.

## Application registry

The service needs a registered-application model containing at least:

```text
client_id
display_name
client_type: web, native, or service
redirect_uris
trusted_origins
allowed_scopes
pkce_required
status: active or disabled
created_at
updated_at
```

Confidential applications may have server-side credentials. Public applications, including mobile apps, must not depend on a secret that can be extracted from the client binary.

## Clone-and-configure process

A new deployment should be created by:

1. Cloning the repository.
2. Providing environment and secret configuration.
3. Setting the canonical auth URL and issuer.
4. Configuring branding and email delivery.
5. Connecting a dedicated PostgreSQL database.
6. Registering consuming applications and redirect URIs.
7. Running migrations.
8. Running the integration and security test suite.
9. Deploying the auth service.

The clone process must not require editing core identity code merely to change the platform name, domain, email provider, or consuming applications.

Official references:

- [Better Auth session management](https://better-auth.com/docs/concepts/session-management)
- [Better Auth multi-session](https://better-auth.com/docs/plugins/multi-session)
- [Better Auth two-factor authentication](https://better-auth.com/docs/plugins/2fa)
- [Better Auth cookies and cross-subdomain cookies](https://better-auth.com/docs/concepts/cookies)
- [Better Auth bearer authentication](https://better-auth.com/docs/plugins/bearer)
- [Better Auth JWT](https://better-auth.com/docs/plugins/jwt)
- [Better Auth OAuth 2.1 Provider](https://better-auth.com/docs/plugins/oauth-provider)

## Session implementation

Use database-backed sessions for the first release. This makes listing, revocation, emergency logout, and security investigation straightforward.

Do not enable fully stateless session behavior until its revocation trade-offs are accepted. If session cookie caching is later enabled, keep its cache lifetime short enough that a revoked session cannot remain usable longer than the product's security policy permits.

The session list should be built from Better Auth session records and should return a safe view model rather than raw tokens:

```text
id: internal session identifier
user_id: owning user
client_type: web or mobile
application: registered application name
device_label: user-friendly label
platform: operating system or browser family
created_at: timestamp
last_active_at: timestamp
expires_at: timestamp
is_current: boolean
revoked_at: timestamp or null
```

The raw token may be used internally to revoke a session but must not be exposed in the user interface or logs.

## Identifier-first flow implementation

Implement the auth journey as explicit server-controlled states rather than making the browser decide whether an account exists:

```text
collect_email
  → existing_account_sign_in
  → new_account_verification
  → account_details
  → authenticated_session
```

The state should be short-lived, bound to the submitted email and client context, and protected against tampering. Do not trust a browser-provided flag such as `is_signup` to decide whether an identity exists.

The API should expose stable, language-agnostic responses that allow web and mobile clients to render the correct next step without exposing unnecessary account details. The account-enumeration policy must be chosen explicitly:

- Direct branching provides the smoothest UX but needs strong rate limiting and monitoring.
- Neutral branching sends an email verification challenge before revealing whether the identity already exists.

## Account-switcher implementation

The account switcher should be an application-facing experience backed by auth sessions:

1. Display the currently active account or identity.
2. Display accounts already available to the user.
3. Offer “Add account” or “Create account.”
4. Start the identifier-first flow.
5. Authenticate or create the additional identity.
6. Confirm application membership or account access.
7. Add the resulting session to the switcher.
8. Mark the selected account as active.

The `accounts/` consuming app provides the profile-card dropdown and add-account entry point while Better Auth provides the persisted multi-session identities and selected-session activation. The consuming UI only presents an account as available when its multi-session entry is present and valid. Account-level logout uses Better Auth `/multi-session/revoke` with the selected session token; the global `/sign-out` endpoint is reserved for global sign-out semantics and must not be used by the switcher.

The account record retained by the switcher must include its onboarding state. After a modal signup creates an account, abandoning setup marks the entry as `Onboarding incomplete`. Selecting that entry activates its session and routes to `/onboarding`; completing the username changes the entry to ready and permits the normal `/<username>` app-shell route.

The service must not automatically merge two users merely because the same person controls both email addresses. Account linking requires a separate explicit design with reauthentication and clear user confirmation.

The active account context should be sent to the consuming application only after that application has verified the user's membership. Product roles and permissions must not be inferred solely from the auth service session.

## OTP implementation

OTP delivery must sit behind a provider boundary so the authentication core does not depend directly on one email or SMS vendor.

The implementation must define:

- Code length and format.
- Expiry duration.
- Maximum verification attempts.
- Resend cooldown.
- Maximum sends per email, IP, and device.
- Provider failure behavior.
- Generic user-facing error messages.
- Audit events for requested, delivered, failed, verified, expired, and locked challenges.

OTP must be generated and checked by the auth service or Better Auth. It must never be logged or stored in plaintext after verification.

## Trusted-device implementation

Trusted-device state should be represented by an expiring, revocable record or Better Auth trusted-device capability. The browser or mobile application receives only the credential needed to prove trust.

The design must support:

- A finite trust period.
- Rotation after successful use where supported.
- Revocation from the security screen.
- Revocation after password reset or a major security event.
- A visible device list.
- OTP fallback when the trust credential is missing or invalid.

Do not use a browser fingerprint as the sole device identity.

## Cross-subdomain configuration

The production configuration must explicitly define:

- Canonical auth URL.
- Allowed hosts.
- Trusted origins.
- Cookie domain and path.
- Secure and HTTP-only attributes.
- SameSite behavior.
- Local-development domain strategy.
- Trusted application list.

The reusable default is a host-only auth cookie plus standards-based SSO and host-only application cookies. Do not use a broad parent-domain cookie until every subdomain receiving it is treated as part of the same security boundary. Parent-domain cookies are an explicit first-party deployment option, not a requirement for SSO.

## Mobile implementation

Mobile applications should use Authorization Code with PKCE and store resulting session credentials in secure platform storage. The mobile client must support:

- Sign in.
- OTP challenge and verification.
- Session refresh or renewal.
- Sign out.
- Session revocation response.
- Recovery when a token is expired or revoked.

If a mobile app needs a signed token that another backend verifies without calling the auth service, use the JWT capability with an explicit issuer, audience, expiry, minimal claims, JWKS publication, and key-rotation policy.

## Database and operations

Use PostgreSQL for the initial deployment. Keep database migrations additive and compatible with rolling releases.

Initial operational requirements:

- Connection pooling.
- Automated backups.
- Restore testing.
- Structured security logs.
- Error monitoring.
- OTP delivery monitoring.
- Rate-limit metrics.
- Alerts for authentication outages and database failures.

Redis or another secondary store should be introduced only after measurement shows that PostgreSQL cannot meet the required session or rate-limit workload.

## Test plan

Before production use, test:

- Signup and email verification.
- Login success and failure.
- Expired and invalid OTPs.
- Resend and attempt limits.
- New-device and trusted-device flows.
- Multiple simultaneous sessions.
- Listing sessions from web and mobile.
- Revoking the current, another, all other, and all sessions.
- Password change and recovery revocation behavior.
- Cookie behavior across supported subdomains.
- Safari and privacy-restricted browser behavior.
- Rolling deployment with old and new instances using the same database.

## Pilot web routing implementation

The root resolver checks the current session and then Better Auth multi-session cookies. It routes complete accounts to `/<username>`, incomplete accounts to `/onboarding`, and signed-out users to the Hosted Auth Screen. If the current session is absent but a valid multi-session cookie remains, it activates the next available session. A consuming application can pass `returnTo`; the value is accepted only when its origin is in `AUTH_TRUSTED_ORIGINS`. The accounts app uses this handoff for initial login and for its full-page add-account flow with `intent=login`.

The product account shell validates its session through the auth HTTP boundary. The accounts app consumes the multi-session list, activates selected sessions, renders active-session management, and sends the current session token to Better Auth’s `/multi-session/revoke` endpoint for account-specific logout. This revokes only the selected account’s device session and lets Better Auth activate another remaining account session. The global `/sign-out` endpoint is intentionally not used for account switching because it revokes all multi-session cookies on the client.

The shared `packages/account-switcher` component keeps Auth compatibility pages and consuming apps fresh across same-origin tabs using `BroadcastChannel` and a `storage` fallback. It publishes only event type, ID, and timestamp, revalidates on tab activation, and emits `muflah:active-account-changed`, allowing each app to soft-refresh without a hard browser reload. Existing-account login verifies a password, sends a sign-in email OTP, and creates the session only after OTP verification. Signup verifies the email before password creation.
