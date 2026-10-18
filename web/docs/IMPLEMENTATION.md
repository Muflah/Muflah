# Web Template Implementation

## Product surface

The pilot exposes one protected calculator route at `/`. Calculator state remains local to the product UI and is not persisted by Auth.

## Authentication flow

`web/lib/auth-client.ts` checks `/auth-api/get-session`. If no active user is returned, the app redirects to `AUTH_URL/login` with `returnTo`. Auth performs password-plus-OTP login, email-OTP signup verification, and onboarding, then redirects back to the Web app.

The shared `<account-switcher auth-url="...">` component handles account listing, account activation, add-account navigation, selected-account logout, and cross-tab refresh. It revalidates the Auth session when the tab becomes active and displays `You’re now using @username (full@email.com).` when another tab changed the active account. The Web app listens for `muflah:active-account-changed` and updates its current user without a hard reload, preserving calculator state.

## API proxy and configuration

`web/next.config.ts` rewrites `/auth-api/:path*` to `${AUTH_URL}/api/auth/:path*` and `/onboarding-api/:path*` to `${AUTH_URL}/api/onboarding/:path*`.

If the returned user has an incomplete `onboardingStatus`, the calculator mounts `<muflah-onboarding>` and returns to the calculator after Auth completes the existing onboarding API call. This is a presentation gate only; Auth remains authoritative and its `/onboarding` route remains available as a fallback.

```env
AUTH_URL=https://auth.example.com
```

Use a separate Vercel project with `web` as the root directory. Keep real environment files and `node_modules` out of version control.

## Verification checklist

- The calculator is inaccessible without an active Auth session.
- Auth returns the user to the Web route after authentication.
- Account switching preserves the product URL.
- Selected-account logout returns through Auth.
- The component works without Web-specific identity logic.
- `npm run typecheck` and `npm run build` pass before deployment.
