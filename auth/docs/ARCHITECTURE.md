# Architecture

This document describes the target reusable architecture. It is intentionally broader than the current hosted pilot; use `../../AUTH.md` for the implementation-status truth and current handoff context.

## Purpose

This project is a reusable, headless identity provider and single sign-on platform for current and future applications. It must be possible to clone and configure this repository for another product platform without copying product-specific authentication logic.

It is a centralized identity and session service, not a product dashboard and not an application-specific authorization service.

## Technology stack

The V1 stack is intentionally conventional and operationally small. It supports a modular monolith today while leaving clear integration boundaries for future consuming applications.

| Layer | Choice | Role |
| --- | --- | --- |
| Runtime | Node.js | Runs the auth service and its build/test tooling |
| Language | TypeScript | Type-safe application and integration code |
| Web framework | Next.js | Hosts the thin UI, stable HTTP routes, and deployment boundary |
| UI library | React | Renders the minimal hosted authentication screens |
| Authentication engine | Better Auth | Owns credentials, sessions, cookies, verification, OTP capabilities, and supported auth plugins |
| Database | PostgreSQL | Source of truth for users, sessions, accounts, verification state, trusted devices, and registered clients where persisted |
| Database access | Better Auth adapter plus PostgreSQL client | Connects the auth engine and application-owned persistence boundaries to PostgreSQL |
| Email delivery | Resend for V1 | Sends verification, OTP, recovery, and security emails through a managed API |
| Email abstraction | Provider-neutral connector | Keeps templates and message contracts independent from the delivery provider; future managed providers can be added without changing auth flows |
| Package management | npm | Installs dependencies and maintains the committed lockfile |
| Testing | TypeScript-aware unit, integration, contract, and browser tests | Protects security policies, database behavior, stable APIs, and end-to-end UX |
| Deployment model | One modular-monolith service with rolling deployment | Keeps V1 simple while requiring backward-compatible schema and API changes |

### Stack principles

- Better Auth is the authentication engine; the project must not reimplement password hashing, session primitives, cookie handling, or OTP primitives without a documented exception.
- PostgreSQL is the authoritative persistence layer. In-memory state may be used only for non-critical caches or local development helpers.
- Resend is the only V1 email provider. The connector boundary is provider-neutral, but SMTP and self-hosted mail transport are intentionally excluded.
- Next.js/React provide only the thin hosted auth surface. Consuming applications remain free to use their own web or mobile stack through the headless integration.
- TypeScript modules remain inside the modular monolith until scale, isolation, or operational requirements justify extracting a service.
- No technology choice should force product-specific organizations, roles, permissions, billing, analytics, or business data into the auth service.

### Deferred stack decisions

The following are intentionally not required for V1:

- A separate microservice architecture.
- A dedicated message broker or application-owned email queue.
- Redis as a source of truth for sessions or OTP state.
- A JWT/JWKS key-management subsystem before an independently verifiable JWT consumer exists.
- A separate mobile backend; mobile clients use the same auth service through the supported authorization and bearer flows.

## Starter repository structure

The initial repository is intentionally small, but its boundaries are set up for reuse. The structure separates the authentication engine, hosted UI, provider integrations, application registration, deployment configuration, and verification work.

```text
auth/
├── .env                         # Local secrets and deployment values; never commit
├── AGENTLOG.md                  # Project history and operating notes
├── package.json                 # Root project manifest and scripts
├── package-lock.json            # Root dependency lockfile
├── docs/                        # Product, architecture, release, and implementation docs
└── app/                         # All implementation and supporting project files
    ├── .env.example             # Safe configuration reference without secret values
    ├── next.config.ts           # Web/runtime configuration
    ├── tsconfig.json
    ├── config/
    │   └── applications.example.json # Example registered clients and redirect rules
    ├── migrations/              # Database migrations and compatibility changes
    ├── src/
    │   ├── app/                 # Thin hosted UI and stable HTTP route handlers
    │   │   ├── api/
    │   │   │   ├── auth/[...all]/ # Better Auth endpoint boundary
    │   │   │   └── health/      # Deployment health endpoint
    │   │   ├── account/          # Account selection and account-switching screens
    │   │   ├── security/sessions/ # Active-session list and revocation UI
    │   │   ├── verify/           # Email/OTP verification UI
    │   │   └── reset-password/   # Password recovery UI
    │   ├── components/auth/     # Small reusable auth UI components
    │   └── lib/
    │       ├── auth.ts          # Single Better Auth server configuration
    │       ├── auth-client.ts   # Browser/client helpers
    │       ├── config.ts        # Validated environment and deployment config
    │       ├── database.ts      # Database pool and persistence boundary
    │       ├── email/            # Managed email connector, aliases, and templates
    │       ├── applications/    # Registered-client loading and validation
    │       └── security/         # Policy, secret references, audit/security events
    └── tests/
        ├── unit/                # Policy, parsing, and pure-function tests
        ├── integration/          # Database, Better Auth, and provider tests
        ├── contract/             # Stable API and client contract tests
        └── e2e/                  # Browser, SSO, account switching, and logout journeys
```

### Boundary rules

- `src/lib/auth.ts` is the only place that assembles the Better Auth instance. Features must not create competing auth instances.
- `src/app/api/auth/[...all]` exposes the stable auth boundary; product applications consume it rather than importing internal modules.
- `src/app` contains only the thin hosted UI and route composition. Product dashboards, product navigation, and product authorization do not belong here.
- `src/lib/email` owns provider adapters and message templates. It may use managed email APIs such as Resend, but it must not grow an SMTP or self-hosted mail-server layer.
- `src/lib/applications` owns registered-client configuration and redirect/origin validation. It does not own product users, organizations, roles, or permissions.
- `migrations` must support rolling deployment through expand-and-contract changes.
- `tests/contract` protects the unversioned API and SSO contracts that future clones and consuming applications rely on.
- New domain modules should be added only when a V1 requirement needs them. Better Auth remains the owner of core credentials, sessions, cookies, OTP primitives, and account records unless a documented extension is required.

The top-level `auth/` folder is a clean project container with two deliberate root-level exceptions: `package.json` and its lockfile. They are kept at the root because they define the dependency graph and standard project commands. Apart from those manifest files, `.env`, documentation, and project notes, implementation files such as `.ts`, `.tsx`, application-registration `.json`, migrations, and framework configuration belong under `auth/app/`. This keeps the reusable service implementation isolated and makes the container easy to inspect, archive, or clone.

The repository may start without every directory shown above. The structure is a target boundary, not permission to create empty abstractions. Build the first vertical slice around the identifier-first flow, then add only the modules needed by the next accepted capability.

## Thin hosted UI

The service includes a small hosted UI layer for authentication journeys that need a browser surface. This UI is a fallback and protocol companion, not a full product interface.

The hosted UI should be:

- Framework-light and easy to theme through configuration.
- Accessible and responsive.
- Usable from desktop browsers and mobile system browsers.
- Minimal in client-side JavaScript.
- Independent of any consuming product's navigation, dashboard, or design system.
- Safe to use during SSO redirects and account-selection flows.

Most product experiences use the HTTP/JSON APIs or an application SDK. The hosted UI exists for direct visits to the auth domain, browser redirects from applications, account recovery, OTP entry, and onboarding. Product account dashboards and account-management shells belong to consuming applications such as `accounts/`.

The service should allow web and mobile applications to use the same identity while keeping each application free to define its own resources, roles, permissions, and business rules.

## High-level model

```text
Web application ───── local session ─────┐
                                         │
Mobile application ─ bearer session ────┤
                                         ▼
                              auth.example.com
                                         │
                    Better Auth + HTTP/JSON + SSO protocols
                                         │
                                      PostgreSQL
                                         │
                    Managed email delivery provider
```

## Identity-provider and SSO model

The auth service is the central identity authority. Applications register with it and trust it to authenticate users. The preferred reusable integration is a standards-based authorization flow:

```text
1. User opens an application.
2. The application redirects the user to the auth service.
3. The auth service checks its central session.
4. The user signs in only if no valid central session exists.
5. The auth service returns a short-lived authorization result.
6. The application creates its own host-only local session.
```

This gives users single sign-on without requiring every product to receive the central session cookie directly. A shared parent-domain cookie may be supported for explicitly trusted first-party applications, but it is an optional optimization rather than the foundation of the reusable platform.

## Service responsibilities

The auth service owns:

- User identity.
- Verified email addresses.
- Password credentials.
- Public usernames or handles.
- Authentication challenges and OTP verification.
- Active sessions and session expiry.
- Trusted-device records.
- Account switching between identities or sessions where supported.
- Session listing, individual revocation, and global revocation.
- Application/client registration.
- Redirect URI and trusted-origin validation.
- SSO authorization and token exchange.
- Issuer, key, and protocol configuration.
- A thin hosted authentication and security UI.
- A provider-independent transactional email connector and template system.

Consuming applications own:

- Application accounts, organizations, and memberships.
- Roles and permissions.
- Product-specific authorization policies.
- Product data and business workflows.

An authentication session establishes who the user is. It must not automatically grant access to every resource in every application.

## Client types

### Web

Web applications use host-only, secure, HTTP-only local cookies after completing SSO with the auth service. The auth service uses its own secure session cookie at its auth domain. Cross-subdomain cookies may be used only for explicitly trusted first-party applications and must not be required by the core SSO design.

### Mobile

Mobile applications use Authorization Code with PKCE through the auth service and store resulting credentials in operating-system secure storage, such as iOS Keychain or Android Keystore. Mobile clients must not depend on browser cookie behavior or parent-domain cookies.

## Identity model

Email is the private login and recovery identifier. A username or handle is a separate, public, unique identifier used for display, URLs, mentions, or discovery.

The username must not be treated as proof of email ownership and should not be permanently derived from the email address.

## Onboarding state

Email verification and account creation are separate milestones. A user may verify an email address without completing the required account setup.

The user record should store:

- `onboardingStatus`: the current onboarding state, initially `pending` and later `complete`.
- `onboardingCompletedAt`: the timestamp at which required onboarding finished, or `null` while incomplete.

Do not store a second boolean completion flag. APIs may expose a derived `onboardingComplete` boolean for convenience, but the service must treat onboarding as complete only when the status, timestamp, and required identity fields—especially the username—are consistent.

An incomplete account may authenticate to continue setup, but it must not receive product access through SSO until onboarding is complete. The auth service redirects the user to `/onboarding` and resumes the original application request after completion. The welcome email is sent only after onboarding completes.

## Session model

Every successful login creates or refreshes a separately revocable session. A session represents one signed-in browser, mobile installation, or client context.

Each session should expose safe metadata such as:

- Device or browser label.
- Platform.
- Application name.
- Created time.
- Last active time.
- Expiry time.
- Approximate location or IP-derived region where appropriate.
- Whether it is the current session.

Raw session tokens must never be shown to users or returned unnecessarily to application interfaces.

## Trusted-device model

A trusted device is not the same thing as an active session. Trust allows the user to skip a future OTP challenge for a limited period. It must be independently revocable and must expire automatically.

Web trust uses a secure, HTTP-only cookie. Mobile trust uses secure operating-system storage. Device fingerprinting alone must not be used as an authentication factor.

## Account switching

The auth service may support multiple concurrent sessions and switching between them. If an application has organizations or workspaces, the application owns the user's membership and active application account context.

Changing the active account must never create authorization that the application has not independently verified.

The account switcher must support two entry points:

- Switch to an account that is already available to the user.
- Add an existing account or create a new account using the same identifier-first authentication flow as the main sign-in experience.

For a consuming account UI such as `accounts/`, the profile card is the switcher trigger. It opens a dropdown containing the active identity and available identities, plus an “Add account” action. “Add account” starts a full-page auth flow with an explicit login intent and a validated return target.

An account added through the switcher retains its onboarding state. If signup/password creation succeeds but onboarding is abandoned, the switcher may show that identity with an `Onboarding incomplete` state. Selecting it routes to `/onboarding`; the identity must not receive product access until onboarding is complete.

Adding an account must create or select a separately authenticated session. It must not silently merge accounts, link identities, or grant access to an application account without the application's membership check. The auth service owns the session transition; the consuming UI owns only the presentation and navigation.

## Identifier-first authentication

The primary authentication journey begins by asking for the user's email address. The service then continues through a state-driven flow:

```text
Email address
  ├── Existing identity → password or approved sign-in method
  │                         → risk check → OTP if required → session
  └── New identity      → email verification → username/password
                            → account creation → onboarding → session
```

The same flow is used from the main sign-in screen, the account switcher, web clients, and mobile clients. The UI may differ by platform, but the underlying API states and security rules remain consistent.

## Cloneability

The repository must be product-neutral. Domains, branding, email providers, application registrations, redirect URIs, token issuers, and security policy values must be configuration or integration points rather than hard-coded implementation details.

A new deployment should be possible through this process:

```text
Clone repository
  → configure environment and branding
  → configure database and email provider
  → register applications and redirect URIs
  → run migrations
  → deploy auth service
```

## Reliability model

PostgreSQL is the source of truth for users, sessions, verification records, and revocation state. Application instances must be stateless and safe to run concurrently behind a load balancer.

The first deployment should avoid Redis and multi-region complexity. Add secondary storage only when measured traffic or availability requirements justify it.

Database migrations must be backward-compatible during rolling deployments.

## V1 scope and rolling release

V1 is the first complete reusable identity platform, not a disposable login demo. It must be deployable for multiple applications while remaining intentionally limited to core identity, authentication, SSO, sessions, and security workflows.

The service uses unversioned, stable API and browser URLs. There must be no `/v1` path, version query parameter, or version-specific cookie name in the normal contract.

Rolling releases require old and new application instances to run together safely. Database schemas, cookies, session records, authorization codes, webhook events, and API responses must remain compatible across adjacent deployments.

New behavior should be introduced additively. Clients must tolerate unknown response fields and servers must preserve existing request fields and response meanings. Breaking changes require an explicit migration plan and coordinated client transition rather than silently changing an existing unversioned contract.

## Email connector model

Email delivery is an integration boundary, not a dependency embedded throughout the authentication flows.

```text
Authentication event
        │
        ▼
Email template + rendered variables
        │
        ▼
Email connector
        ├── Resend adapter
        ├── SendGrid adapter
        └── Future managed email provider adapters
```

The auth service should be able to change email providers without changing signup, OTP, recovery, or security logic. Templates should be selected by stable message type, rendered consistently, and passed to the configured connector.

The connector intentionally supports managed email APIs only. SMTP adapters, self-hosted mail servers, and application-owned mail transport are out of scope so email deliverability does not become an additional infrastructure product.

## Cross-application logout

For V1, central logout invalidates the user's central auth session. Applications revalidate the central session at login, token exchange, and sensitive actions.

Signed back-channel logout events are a later capability. When implemented, the auth service will send a signed server-to-server logout event to each registered application that has an affected session.

A front-channel or redirect-based logout flow is also deferred. Central revocation remains authoritative, and applications must revalidate central sessions at defined points so missed notifications do not create permanent access.

V1 logout must support:

- Current application only.
- Current central session.
- All sessions for the user.
- Applications revalidate central session state before granting access after central logout.

## Application registration

Applications are registered in the auth service's application registry. Initial registration should be configuration-as-code or an operator-controlled administrative command. A future protected admin API may manage the same registry without changing the protocol.

Self-service public application registration is out of scope. Every registered application must have an owner, an explicit client type, approved redirect URIs, trusted origins, post-logout redirect URIs, and a lifecycle status.

## Email identity recovery

Email is a critical identity and recovery factor. Changing it requires a deliberate account-security workflow, recent authentication, and verification of the new address. Additional recovery proof for loss of the old address is a later capability.

If the user loses access to the old email, V1 does not automatically replace the verified email address. Lost-email recovery, recovery codes, authenticator factors, and controlled support review are later capabilities.

## Key management

Key management begins before JWT support. Cookies, OTP state, reset links, authorization codes, webhook signatures, and other security values require managed secrets or signing keys.

V1 requires managed secrets, ownership, purpose, access controls, basic rotation, and safe overlap during rolling deployment. Full signing-key inventory, JWKS management, and JWT key administration are deferred until independently verified JWTs are required. Key material must be stored in deployment secret management or a KMS, never in the repository or ordinary application logs.

## Hosted web routing and tab coordination

The hosted web app has a primary **Hosted Auth Screen** plus onboarding and compatibility security routes. The root route resolves the server-validated session state: no valid session shows auth, an incomplete account shows `/onboarding`, and a complete account may show its canonical username route for direct auth-domain visits. Consuming applications such as `accounts/` provide the product-facing account shell. Auth also owns the reusable framework-neutral account switcher at `auth/packages/account-switcher`; consuming apps mount it rather than reimplementing account switching. They start auth with a validated `returnTo` URL; add-account flows use explicit login intent so an existing active session does not short-circuit the flow.

The resolver checks the current session and valid Better Auth multi-session cookies. If the current session is unavailable but another account remains active, it activates the next valid session. Session-check failures show retry rather than falsely treating the user as signed out. Protected account routes revalidate server-side.

The switcher activates only the selected identity. The security page filters sessions by the selected account’s user ID. Logout revokes sessions for the selected identity and clears its active cookie without revoking unrelated identities. Incomplete identities are labeled and route to `/onboarding` without product access.

The web layer publishes non-sensitive `account-switched`, `account-logged-out`, and `session-revoked` events through `BroadcastChannel`, with a `storage` fallback. Visible tabs reload immediately; hidden tabs reload on focus. Events contain no session tokens.
