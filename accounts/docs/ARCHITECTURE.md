# Accounts Architecture

## Purpose

`accounts/` is the product-facing account and settings application. It owns presentation and navigation; Auth owns identity, authentication, sessions, account switching rules, onboarding state, and account mutations.

## System boundary

```text
Browser
  │
  ▼
Accounts UI ── /auth-api/* and /onboarding-api/* rewrites ──► Auth API
  │                                      │
  └── account-switcher web component ◄───┘
```

Accounts must not import implementation code from `auth/app`, maintain an identity database, or create a second session model. `AUTH_URL` is the only deployment-specific Auth origin used by the app.

## Responsibilities

Accounts owns:

- Account overview, profile, security, sessions, and settings presentation.
- Navigation, loading states, errors, and display-level validation.
- Product-specific account UI that does not change Auth state semantics.

Auth owns:

- Credentials, verification, password recovery, cookies, and sessions.
- Multi-account session activation and selected-account revocation.
- Identity, onboarding state, and authoritative API responses.

## Shared switcher

The reusable `@muflah/account-switcher` web component is Auth-maintained at the shared root package `packages/account-switcher`. Accounts mounts it as `<account-switcher auth-url="...">`; it is not an Accounts implementation and can be consumed by other products.

The reusable `@muflah/onboarding` web component is also Auth-maintained at `packages/onboarding`. Accounts renders it only when the Auth session reports incomplete onboarding. The component calls Auth's existing completion endpoint; Accounts does not own onboarding state or username rules.

## Routes

| Route | Responsibility |
| --- | --- |
| `/` | Account overview and session gate |
| `/profile` | Profile presentation |
| `/security` | Security overview |
| `/security/sessions` | Active sessions and selected-session revocation |
| `/settings` | Account settings presentation |

## Deployment

The Vercel project uses `accounts` as its root directory and requires `AUTH_URL`. The deployed Accounts origin must be included as a full origin in Auth's `AUTH_TRUSTED_ORIGINS`.
