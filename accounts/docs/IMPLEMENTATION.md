# Accounts Implementation

## Authentication handoff

The server-rendered app receives `AUTH_URL` and the client checks the Auth session through `/auth-api/get-session`. When no user is present, Accounts redirects to Auth with a validated `returnTo` URL. Auth returns the user to the original Accounts route after login, signup, verification, or onboarding.

The add-account action uses `intent=login` so an existing active session does not bypass the additional login flow.

## Auth API boundary

`accounts/next.config.ts` rewrites `/auth-api/:path*` to `${AUTH_URL}/api/auth/:path*`. Browser code calls only the local rewrite, which keeps the Auth origin configurable and avoids hard-coded production domains.

The shared switcher uses Auth multi-session endpoints for device-session listing, activation, and selected-account revocation. Accounts must preserve the distinction between selected-account logout and global sign-out.

## Cross-tab behavior

Session changes publish non-sensitive events through `BroadcastChannel` with a `localStorage` fallback. When an Accounts tab becomes visible, receives focus, or returns from the browser back/forward cache, the shared switcher revalidates `/auth-api/get-session` with a no-store request. If the active account changed, it updates the switcher, shows the account-change toast, dispatches `muflah:active-account-changed`, and Accounts performs a soft refresh rather than a hard browser reload. Events contain no session tokens.

## Configuration and deployment

```env
AUTH_URL=https://auth.example.com
```

Set the variable in local `.env` and in the Vercel project. Use `npm run typecheck` and `npm run build` before deployment. Do not commit `.env` or dependency folders.

## Verification checklist

- Unauthenticated route redirects to Auth and returns to the original route.
- Existing session loads the account shell.
- Account switch preserves the current Accounts route.
- Selected-account logout does not revoke unrelated accounts.
- Add-account uses explicit login intent.
- Session changes refresh other open tabs.
