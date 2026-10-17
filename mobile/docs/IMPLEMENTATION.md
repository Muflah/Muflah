# Mobile Implementation Plan

This document describes the planned implementation. No mobile application code is committed yet.

## Phase 1: Expo foundation

- Create the project with Expo and TypeScript.
- Configure the app name, package identifier, Android application ID, icon, and deep-link scheme.
- Add Expo Router and a minimal protected calculator route.
- Define `EXPO_PUBLIC_AUTH_URL` as the configurable Auth origin.
- Keep secrets out of the mobile bundle and repository.

## Phase 2: Auth client

- Add the Better Auth Expo server plugin to the Auth service when the mobile flow is implemented.
- Add the Better Auth Expo client plugin to the mobile app.
- Use `expo-secure-store` for cookies/session data.
- Configure the mobile scheme and the corresponding Auth trusted origin.
- Implement login, signup, password recovery, email verification, and onboarding handoff.
- Handle expired, revoked, and unavailable sessions distinctly.

The implementation must follow the current Better Auth Expo integration rather than manually copying web cookies or inventing a bearer-token format. See the [Better Auth Expo integration](https://better-auth.com/docs/integrations/expo).

## Phase 3: Session and account switcher

- Load the current session through the Auth client.
- List device sessions through Better Auth multi-session APIs.
- Build a native account switcher with the active account clearly marked.
- Activate an account through Auth and update the native session context.
- Revalidate using Expo `AppState` whenever the app becomes active.
- Refresh account-specific UI without resetting unrelated local calculator state.
- Show `You’re now using @username (full@email.com).` after a successful account change.
- Revoke only the selected account session for account-level logout.
- Re-check the session before sensitive actions.

## Phase 4: Android test build

The first test should use an Android development build. Expo Go may be useful for early UI work, but a development build is the intended path once native authentication, secure storage, or deep-link configuration is involved. Use EAS Build to create an installable Android build; use an APK for direct device testing and an AAB for Play Store distribution.

## Verification checklist

- A signed-out user is sent through the Auth flow and returned to the mobile app.
- Existing users can sign in without a second identity implementation.
- Signup, verification, password recovery, and onboarding return to the app correctly.
- Two accounts can remain active in one mobile installation.
- Switching accounts updates the native account label and calculator session context.
- Returning from the background revalidates the active session.
- Revoking the selected account does not revoke unrelated account sessions.
- Expired or revoked sessions cannot perform protected actions.
- No raw session token appears in logs, UI, analytics, or ordinary app state.
- The Android development build installs on a physical device.
