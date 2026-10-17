# Web App Template Handoff

`web/` is a minimal protected product template used to validate that a new Muflah application and subdomain can integrate with the central auth service.

## Scope

The pilot is a calculator. It owns only its product UI and calculator state. Auth owns identity, authentication, cookies, sessions, and logout.

## Authentication flow

1. A visitor opens the web app.
2. The app calls the auth service through its `/auth-api` rewrite.
3. If there is no active session, the app redirects to `AUTH_URL` with a `returnTo` URL.
4. Auth handles login, signup, verification, and onboarding.
5. Auth returns the user to the web app.
6. Logout revokes the selected auth session and returns the user through auth.

The web app does not import code from `auth/app` or maintain a second identity/session store.

## Deployment

Configure a separate Vercel project:

- Root directory: `web`
- Framework preset: Next.js
- Environment variable: `AUTH_URL`
- Add the deployed web origin to auth's `AUTH_TRUSTED_ORIGINS`

Example local configuration:

```env
AUTH_URL=https://auth.example.com
```

The deployed web origin must be added as a full origin, including `https://`, to the auth service's trusted-origin list.
