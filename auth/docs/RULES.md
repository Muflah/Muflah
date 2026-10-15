# Authentication Rules

This document defines the product-neutral business rules and user experience for the reusable auth service.

## Account discovery and privacy

- Start with an email address and a `Next` action.
- Do not reveal whether an email address is registered before the user proves control of that address.
- Use neutral messages such as: “We have sent you an email.”
- Normalize email addresses by trimming whitespace and using lowercase comparison.
- A verified email address may be told that an account already exists because the user has already proven control of it.

## Signup

1. User enters an email address.
2. The service sends a signup OTP.
3. The UI shows a neutral email-sent message.
4. User enters the OTP.
5. User enters and confirms a password.
6. The service creates the platform account and enables the login security policy.
7. User completes the platform profile with a name, unique username, and date of birth.

If the user leaves after OTP verification, the service keeps only a temporary verified signup session. If the user leaves after creating the password, the account remains valid but onboarding is incomplete. The next login resumes profile completion.

The root URL handles the complete authentication flow: email, OTP, and password. After authentication, a new account or an existing account with an incomplete profile is sent to `/onboarding` to choose the platform identity. A completed account is sent to its username path, such as `/muflah95`, which is the authenticated landing screen for this auth service. Consuming products must enforce the same `onboardingComplete` check before opening their product shell.

The auth service owns this platform-wide identity profile. Consuming products own additional product-specific profile fields.

Route rules:

- `/` is the single authentication surface for email entry, OTP verification, password login, password creation, and password reset entry points.
- `/onboarding` is used for new accounts and existing accounts whose platform profile is incomplete.
- `/<username>` is the authenticated landing screen for a completed account, for example `/muflah95`.
- A completed profile redirects to the user's actual username path, never to a literal `/username` path.

Username rules:

- Usernames are globally unique within the auth service.
- Usernames are normalized to lowercase.
- Usernames use letters, numbers, dots, and underscores, with a 3–30 character limit.
- Reserved names such as `admin`, `api`, `auth`, and `support` are unavailable.

Date of birth is sensitive profile data and should only be collected when required by the platform or a product requirement.

Signup password requirements:

- At least 8 characters.
- At least one uppercase letter.
- At least one lowercase letter.
- At least one number.
- At least one special character.
- Confirmation must exactly match the password.

Signup OTP verification must use a signup-specific verification path. It must not use the login OTP endpoint or delete existing credentials.

## Login

1. User enters an email address.
2. The service sends a neutral email OTP challenge without revealing account existence.
3. After email ownership is proven, an existing user enters the password.
4. The service evaluates the device/session trust state.
5. The email OTP already satisfies the initial email/risk proof for this login attempt; the service must not immediately send a duplicate OTP.
6. A successful password check creates or promotes the normal Better Auth session.

Password errors remain generic so they do not disclose whether an account exists.

## OTP

- OTPs are single-use.
- OTP expiry is configured in minutes with `AUTH_OTP_EXPIRES_IN_MINUTES`.
- The default expiry is 3 minutes.
- Failed attempts are limited by `AUTH_OTP_MAX_ATTEMPTS`.
- OTPs must never be logged.
- Resend cooldowns and email/IP rate limits remain required production hardening.
- The UI offers a resend action after a 30-second cooldown.

## Trusted devices

- Trusted-device state must use a signed, secure, HTTP-only cookie.
- Trusted-device state must expire and rotate.
- The current trusted period is 30 days.
- Browser fingerprints alone must not be treated as proof of trust.
- Signing out does not necessarily revoke every trusted device; explicit device/session management will be added with the session module.

## Account switching and multiple sessions

- Use Better Auth's official multi-session plugin rather than a custom session-cookie implementation.
- `AUTH_MAX_SESSIONS` controls the maximum number of active account sessions supported in one browser/device.
- Valid values are whole numbers from 1 through 10. Empty, invalid, zero, negative, decimal, and larger values default to 1.
- The account switcher must list only sessions available to the current browser and activate a selected session deliberately.
- “Add another account” starts the normal signup flow without requiring the current account to be signed out first.
- The add-account flow uses `/?mode=sign-up` and must not redirect an already authenticated user back to the current username path before signup begins.
- Switching accounts must redirect to the selected account's actual username path.
- Cross-tab UI synchronization is a client concern; cookie changes alone must not be assumed to update already-rendered application state.

## Password recovery

- Password reset uses an email link sent through the configured email provider.
- Reset passwords follow the same password policy as signup.
- Password reset should revoke other active sessions when that policy is enabled.

## Account creation email

- After the platform profile is completed, send a welcome/account-creation email from `hello@<AUTH_EMAIL_DOMAIN>`.
- OTP, password-reset, and other security emails use the `auth@<AUTH_EMAIL_DOMAIN>` alias.
- Failure to send the welcome email must not undo a successfully completed account, but it must be logged for delivery monitoring.

## Authorization boundary

The auth service establishes identity and authentication state. Consuming applications own roles, permissions, memberships, and business authorization.
