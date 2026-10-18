export type AuthUser = { name?: string; email: string; username?: string; onboardingStatus?: string };
export type AuthSession = { token?: string; user?: AuthUser };

async function authRequest<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`/auth-api/${path}`, {
    ...init,
    credentials: "include",
    headers: { "Content-Type": "application/json", ...init?.headers },
  });
  if (!response.ok) throw new Error(`Auth request failed (${response.status})`);
  return response.json() as Promise<T>;
}

export function buildAuthUrl(authUrl: string, returnTo?: string) {
  const url = new URL("/login", authUrl);
  const target = returnTo ?? (typeof window !== "undefined" ? window.location.href : undefined);
  if (target) url.searchParams.set("returnTo", target);
  return url.toString();
}

export function getSession() {
  return authRequest<{ user?: AuthUser; session?: AuthSession } | null>("get-session");
}

export function revokeSession(sessionToken: string) {
  return authRequest("multi-session/revoke", { method: "POST", body: JSON.stringify({ sessionToken }) });
}
