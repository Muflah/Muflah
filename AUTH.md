# Auth Service Handoff Context

This file is the working handoff for the reusable authentication service. It records the current implementation truth, deployment assumptions, important decisions, known gaps, and the safest next steps for another agent continuing this work.

## Current objective

Build a reusable identity, authentication, session, account-switching, and SSO service for Muflah and future products. The service owns identity and authentication primitives; consuming applications own organizations, memberships, roles, permissions, billing, and product data.

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

The Hosted Auth Screen is a thin authentication surface. Consuming applications such as `accounts/` own the account home, profile/settings UI, and product shell. Auth owns the reusable account-switcher implementation, delivered as the framework-neutral `@muflah/account-switcher` web component from `auth/packages/account-switcher`; consuming apps only mount it. They start auth with a validated `returnTo` URL; auth returns to that target after login, signup, verification, or onboarding. An explicit `intent=login` is used for add-account flows so an existing active session does not short-circuit the flow.

Existing active sessions are honored when the auth site is opened in a new tab. Cross-tab events use `BroadcastChannel` with a `storage` fallback. Events contain only event type, ID, and timestamp; they never contain session tokens.

## Authentication flows

- Identifier-first email lookup.
- Existing-account login sends a sign-in OTP on every login attempt in the current pilot policy.
- Signup creates a password, verifies email, and then routes to onboarding.
- Onboarding collects the username and marks the account complete.
- Complete accounts route to `/<username>`.
- Incomplete accounts route to `/onboarding` and must not receive product access.
- Username is immutable after onboarding through the configured Better Auth username plugin.

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
| `app/src/components/auth/account-switcher.tsx` | Account list, switching, and add-account modal. |
| `app/src/components/auth/account-actions.tsx` | Selected-account logout. |
| `app/src/components/auth/session-list.tsx` | Individual session revocation UI. |
| `app/src/components/auth/session-sync.tsx` | Cross-tab session event coordination. |
| `packages/account-switcher/src/account-switcher.js` | Framework-neutral account switcher web component owned and published by Auth. |
| `app/src/app/onboarding/page.tsx` | Incomplete-account onboarding UI. |
| `app/src/app/api/onboarding/complete/route.ts` | Onboarding completion and username persistence. |
| `app/src/app/api/identity/lookup/route.ts` | Identifier-first account lookup. |

## Mobile client status

The architecture and requirements call for mobile Authorization Code with PKCE, system-browser authentication, and secure OS credential storage. That flow is not complete in the current codebase.

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
- `auth/docs/REQUIREMENTS.md` — product and security requirements.
- `auth/docs/RELEASE.md` — release scope and closure criteria.
- `auth/AGENTLOG.md` — chronological change history.
