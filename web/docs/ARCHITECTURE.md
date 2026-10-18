# Web Template Architecture

## Purpose

`web/` is a small product template used to validate that a new application and subdomain can integrate with Auth. The pilot product is a calculator; future products may replace the calculator UI while keeping the integration boundary.

## System boundary

```text
Browser
  │
  ▼
Web product UI ── /auth-api/* and /onboarding-api/* rewrites ──► Auth API
  │                                        │
  └──── account-switcher web component ◄───┘
```

The Web app owns calculator state and product presentation. Auth owns identity, authentication, cookies, sessions, logout, and onboarding. The Web app does not import Auth implementation code or depend on the Accounts app.

## Framework-neutral integration

Auth owns `@muflah/account-switcher` as a browser-native web component using HTML, CSS, and JavaScript. It can be mounted by this Next.js template or by a future plain HTML, mobile WebView, or other frontend stack. Native mobile apps should use Auth's mobile API flow instead of this web component.

Auth also owns `@muflah/onboarding`, a browser-native onboarding element. Web renders it when the Auth session reports incomplete onboarding, while Auth remains authoritative for the status, username rules, and completion mutation.

## Deployment

The Vercel project uses `web` as its root directory and requires `AUTH_URL`. The deployed Web origin must be included in Auth's `AUTH_TRUSTED_ORIGINS`.
