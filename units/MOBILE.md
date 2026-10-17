# Mobile Unit

## Scope

The Mobile unit is a native Expo pilot for validating Muflah authentication and session behavior on Android, with a future path to iOS. Its product surface is a minimal calculator; the calculator exists only to provide a protected screen on which session behavior can be tested.

## Requirements

- Use Expo and React Native with TypeScript.
- Use the central Auth service as the authority for identity, authentication, sessions, account switching, onboarding, and logout.
- Use secure platform storage for mobile session credentials.
- Use the system browser or platform authentication session and a registered deep-link scheme for mobile authentication handoff.
- Support login, signup, password recovery, verification, and onboarding return flows.
- Support multiple active account sessions in one mobile installation.
- Provide a native account switcher backed by Auth multi-session APIs.
- Revalidate the active session when the app returns to the foreground.
- Show the active account clearly before account-sensitive actions.
- Show `You’re now using @username (full@email.com).` after an account switch.
- Revoke only the selected account session for account-level logout.
- Keep product calculator state separate from Auth state.
- Do not copy browser cookies, use `AUTH_COOKIE_DOMAIN`, store secrets in the app, or reimplement password/session primitives.

## Boundary

The Mobile app owns native UI, navigation, calculator state, and presentation. Auth owns the APIs, session credentials, account activation, revocation, identity state, and security rules.

## Documentation

- [Architecture](../mobile/docs/ARCHITECTURE.md)
- [Implementation plan](../mobile/docs/IMPLEMENTATION.md)
- [Auth requirements and status](AUTH.md)

## Current status

Documentation only. No Expo application code has been added yet.
