# Muflah Mobile Pilot

This directory is reserved for the native mobile pilot built with Expo and React Native. The first product surface will be intentionally small—a calculator used to exercise authentication and session behavior—not a feature-rich calculator product.

The mobile app will use the central Auth service for login, signup, password recovery, sessions, account switching, and account-level logout. It will not copy browser cookies, implement password handling, or create a second identity system.

## Current status

Documentation is being established before application code is added. See:

- [Mobile unit requirements](../units/MOBILE.md)
- [Architecture](docs/ARCHITECTURE.md)
- [Implementation plan](docs/IMPLEMENTATION.md)

## Planned stack

- Expo and React Native with TypeScript.
- Expo Router for navigation.
- Better Auth Expo client integration.
- `expo-secure-store` for mobile session storage.
- Expo system-browser/deep-link authentication flow.
- EAS development and Android builds for device testing.

The web `@muflah/account-switcher` custom element will not be loaded in the native app. The mobile app will provide a native account switcher backed by the same Auth multi-session APIs.

## Configuration boundary

The Auth origin will be supplied as a public Expo configuration value, planned as `EXPO_PUBLIC_AUTH_URL`. It is an endpoint, not a secret. Mobile redirect schemes and trusted origins will be configured deliberately in Auth and the Expo app configuration.
