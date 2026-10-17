# Web App Template

This is a small protected product template for validating a second application and subdomain against the central auth service.

The pilot calculator is UI-only. Auth owns identity, sessions, cookies, and logout. Configure the auth origin with `AUTH_URL` in `.env` locally and as a Vercel environment variable.

## Vercel

- Root directory: `web`
- Framework preset: Next.js
- Environment variable: `AUTH_URL`
- Add the deployed web app origin to the auth service's `AUTH_TRUSTED_ORIGINS`.

The app sends unauthenticated visitors to auth with a `returnTo` URL and returns them to the web app after authentication.

The account switcher is provided by the Auth-owned, framework-neutral `@muflah/account-switcher` web component. It uses plain browser JavaScript, HTML, and CSS and calls the local `/auth-api` proxy.
