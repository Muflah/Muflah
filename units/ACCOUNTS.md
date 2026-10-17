# Accounts App Handoff

## Purpose

`accounts/` is the pilot frontend for `accounts.mydomain.com`. It provides the user-facing account and settings experience while delegating identity, authentication, sessions, account switching, onboarding state, and account mutations to the auth service.

This is a UI-only application. The auth app is authoritative.

## Boundary

The accounts app may own:

- Page layouts, navigation, account and settings screens.
- Loading, presenting, and refreshing data from the auth API.
- Account-switcher presentation and interaction states.
- Client-side form state and display-level validation.

The accounts app must not own:

- Password hashing, OTP generation or verification, or credential storage.
- Identity records, account records, or session persistence.
- Session cookies, session-token formats, or account-switching rules.
- Product authorization, organizations, roles, memberships, or billing.
- A second authentication provider or an accounts-owned auth database.

## Auth service connection

The auth service URL is configured with `AUTH_URL` in `accounts/.env` for local development and as a Vercel environment variable for deployments.

Example:

```env
AUTH_URL=https://auth.mydomain.com
```

The pilot should use the auth service's HTTP/JSON API. Do not import implementation files from `auth/app` into `accounts`.

## Pilot deployment

The intended Vercel project configuration is:

- Root directory: `accounts`
- Framework: Next.js
- Auth service URL: `AUTH_URL`
- Public host: `accounts.mydomain.com`

The repository currently ignores `.env*` files except `.env.example`. Keep real local and Vercel values out of git.

## Current structure

```text
accounts/
├── app/
│   ├── layout.tsx
│   ├── page.tsx
│   ├── profile/page.tsx
│   ├── security/page.tsx
│   ├── security/sessions/page.tsx
│   └── settings/page.tsx
├── components/
│   ├── account-shell/
│   ├── session-list.tsx
│   └── sessions-page.tsx
├── lib/
│   ├── auth-client.ts
│   └── auth-types.ts
├── docs/
│   ├── ARCHITECTURE.md
│   └── IMPLEMENTATION.md
├── public/
├── .env.example
├── package.json
└── tsconfig.json
```

Detailed app documentation lives in `accounts/docs/ARCHITECTURE.md` and `accounts/docs/IMPLEMENTATION.md`.

The pilot includes the account shell, profile/settings surfaces, account switching, logout, cross-tab session refresh, active-tab session revalidation, and active-session management.

## Shared account header

The reusable account switcher is maintained by Auth and lives in the shared root `packages/account-switcher` package as the framework-neutral `@muflah/account-switcher` web component. Accounts is only one consumer. It contains only HTML templates, CSS, and browser JavaScript. Any product stack can load the component and use `<account-switcher auth-url="...">`; it calls only the consuming app's `/auth-api` proxy and does not own identity or session state.

## Authentication handoff

When an unauthenticated user opens an accounts route, the accounts app sends them to `AUTH_URL` with a trusted `returnTo` URL. Auth handles the authentication flow and returns the user to the original accounts route. Adding an account uses the same full-page auth flow with `intent=login`, so an existing active account does not short-circuit the flow.

Auth validates return origins against `AUTH_TRUSTED_ORIGINS`. The accounts origin must be included there.

## Account and session behavior

The accounts app mounts the shared Auth-maintained account switcher web component, backed by auth-owned multi-session endpoints:

- List device sessions/accounts.
- Activate a selected session.
- Revoke the selected account session for account-specific logout.
- Add another account through the auth authentication flow.
- Revalidate the active session when the tab becomes visible, receives focus, or returns from browser history.
- Show `You’re now using @username (full@email.com).` after another tab changes the active account.
- Soft-refresh Accounts data through `muflah:active-account-changed` without a hard browser reload.

The switcher must preserve the auth app's semantics: incomplete accounts route to onboarding, account logout must not globally sign out unrelated accounts, and session changes should refresh other open tabs.

Unauthenticated routes use this handoff:

```text
accounts route -> AUTH_URL?returnTo=<validated accounts URL>
             -> auth `/login` or `/signup`, OTP verification, and onboarding
             -> original accounts route
```

The add-account action also sends `intent=login` so auth presents the login flow even when another account is already active.

## Auth app reference

The auth service is a Next.js App Router application under `auth/app`. Its important boundaries are:

- `auth/app/src/app/api/auth/[...all]/route.ts` — Better Auth HTTP boundary.
- `auth/app/src/app/api/identity/lookup/route.ts` — identifier lookup.
- `auth/app/src/app/api/onboarding/complete/route.ts` — onboarding completion.
- `packages/account-switcher/src/account-switcher.js` — shared switcher behavior reference.
- `packages/account-switcher/src/account-switcher.js` — cross-tab and active-tab session awareness reference.
- `auth/app/src/lib/auth.ts` — single Better Auth configuration.
- `auth/app/src/lib/config.ts` — runtime configuration and trusted origins.

The accounts frontend should consume stable API behavior rather than duplicate these implementation details.

## Deployment prerequisites

Before testing the deployed pilot:

1. Set `BETTER_AUTH_URL` to the deployed auth origin.
2. Add the accounts origin to `AUTH_TRUSTED_ORIGINS` as a full origin, for example `https://accounts.mydomain.com`.
3. Decide whether the auth session cookie is shared across the trusted parent domain or whether a redirect/proxy integration is required.
4. Configure the same production auth origin as `AUTH_URL` in Vercel.
5. Test login, active-session loading, account switching, incomplete-account onboarding, selected-account logout, and cross-tab refresh.

The auth handoff notes that application registration and full reference-application SSO callbacks are not yet complete. The pilot must not claim complete standards-based SSO until that integration is implemented and tested.

