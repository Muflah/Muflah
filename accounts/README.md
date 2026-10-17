# Accounts Frontend

The product-facing account UI for `accounts.mydomain.com`.

This application is intentionally UI-only. The auth service remains authoritative for identity, login, signup, verification, password recovery, cookies, sessions, account switching, onboarding state, and account mutations. Accounts calls that service through its HTTP API and never imports auth implementation code.

## Routes

- `/` — account overview and session check
- `/profile` — profile surface
- `/security` — security surface
- `/security/sessions` — active sessions and revocation
- `/settings` — account settings surface

## Authentication handoff

When no active session is available, accounts redirects to `AUTH_URL` with a validated `returnTo` URL. Auth completes the flow and returns the user to the exact accounts route they originally requested. The **Add account** action uses the same full-page auth flow with `intent=login` so an already-active account does not bypass the additional login.

Logout revokes only the selected account session and then sends the user to auth. Account switching activates an auth-owned session and preserves the current accounts page. Cross-tab session changes are refreshed through `BroadcastChannel` with a `localStorage` fallback.

The reusable switcher is not owned by this app. Accounts consumes the framework-neutral `@muflah/account-switcher` web component from the shared root `packages/account-switcher` package, maintained by Auth; other products may consume the same component without depending on Accounts.

## Configuration

Set `AUTH_URL` locally in `.env` and as a Vercel environment variable:

```env
AUTH_URL=https://auth.mydomain.com
```

For deployment, configure the Vercel project root directory as `accounts`, use the Next.js framework preset, and keep the real `.env` file out of git.

See [../units/ACCOUNTS.md](../units/ACCOUNTS.md) for the integration boundary, deployment plan, and auth app structure.

Detailed documentation:

- [Architecture](docs/ARCHITECTURE.md)
- [Implementation](docs/IMPLEMENTATION.md)
- [Shared account-switcher package](../packages/account-switcher/README.md)

