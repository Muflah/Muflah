export const USERNAME_PATTERN = /^[a-z0-9](?:[a-z0-9_]{1,28}[a-z0-9])?$/i;

export const RESERVED_USERNAMES = new Set(["api", "login", "logout", "signup", "onboarding", "verify", "health", "security", "settings", "account"]);

export function usernameValues(value: string) {
  const displayUsername = value.trim();
  return { username: displayUsername.toLowerCase(), displayUsername };
}

export function isValidUsername(username: string) {
  return USERNAME_PATTERN.test(username) && !RESERVED_USERNAMES.has(username.toLowerCase());
}
