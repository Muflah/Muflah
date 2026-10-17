# Mobile Architecture

## Purpose

`mobile/` is a native Expo pilot used to validate Muflah authentication and session behavior on Android, with a path to iOS. The calculator is only a small protected product surface for testing the integration.

## System boundary

```text
Native Expo app
  │
  ├── native login/signup/recovery screens or Auth system-browser handoff
  ├── secure mobile session storage
  ├── native account switcher
  └── calculator UI
          │
          ▼
      Auth HTTP API
```

The mobile app owns native presentation, navigation, calculator state, loading states, and mobile-specific error handling. Auth owns identity, credentials, OTP, password recovery, sessions, account activation, revocation, onboarding state, and authoritative responses.

## Mobile session model

Mobile must not depend on browser cookies or `AUTH_COOKIE_DOMAIN`. The client stores its Auth session credentials through the Better Auth Expo integration and platform-secure storage. Auth treats each mobile installation/client context as a separately revocable session.

The app must revalidate the session when it returns to the foreground and before sensitive actions. A missed mobile notification must never allow stale account state to authorize an operation.

## Account switching

The native switcher uses Auth’s multi-session contract:

1. Read available sessions from `/multi-session/list-device-sessions`.
2. Display safe account labels such as username and email; never display session tokens.
3. Activate the selected session through `/multi-session/set-active`.
4. Refresh the native session context and product data.
5. Show a native snackbar or toast:

   > You’re now using @username (full@email.com).

6. Revalidate again when the app becomes active.

Selected-account logout uses `/multi-session/revoke`. Global sign-out must remain a separate explicit action.

## Authentication handoff

The preferred mobile authentication path uses the system browser or platform authentication session with a registered deep-link scheme. Auth returns to the mobile app through that scheme after the flow completes. The app must validate the returned state and never place a client secret in the mobile binary.

## Product boundary

The calculator is deliberately local and simple. It is not an Auth feature, does not persist product data, and should not obscure authentication failures. Its job is to prove that a protected native route can identify the active account and remain safe through account switching, foregrounding, logout, and session revocation.

## Future multi-app behavior

Separate native apps will not automatically share secure storage. If Muflah later ships multiple native apps that must reuse a login, that will require an explicit mobile SSO design using deep links or platform credential-sharing mechanisms. It must not be assumed from web subdomain cookies.
