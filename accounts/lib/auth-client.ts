export type AuthUser = {
  id?: string;
  name?: string;
  email: string;
  username?: string;
  onboardingStatus?: string;
};

export type AuthSession = {
  id?: string;
  token?: string;
  user?: AuthUser;
  expiresAt?: string;
  updatedAt?: string;
  ipAddress?: string | null;
  userAgent?: string | null;
};

export type SessionAccount = {
  id: string;
  name: string;
  email: string;
  username: string;
  onboardingComplete: boolean;
  sessionToken?: string;
};

async function authRequest<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`/auth-api/${path}`, {
    ...init,
    credentials: "include",
    headers: { "Content-Type": "application/json", ...init?.headers },
  });

  if (!response.ok) {
    throw new Error(`Auth request failed (${response.status})`);
  }

  return response.json() as Promise<T>;
}

export function buildAuthUrl(authUrl: string, returnTo?: string, intent?: "login" | "signup") {
  const url = new URL("/login", authUrl);
  const target = returnTo ?? (typeof window !== "undefined" ? window.location.href : undefined);
  if (target) url.searchParams.set("returnTo", target);
  if (intent) url.searchParams.set("intent", intent);
  return url.toString();
}

export async function getSession() {
  return authRequest<{ user?: AuthUser; session?: AuthSession } | null>("get-session");
}

export async function listDeviceSessions() {
  return authRequest<unknown>("multi-session/list-device-sessions");
}

export async function activateSession(sessionToken: string) {
  return authRequest("multi-session/set-active", {
    method: "POST",
    body: JSON.stringify({ sessionToken }),
  });
}

export async function revokeSession(sessionToken: string) {
  return authRequest("multi-session/revoke", {
    method: "POST",
    body: JSON.stringify({ sessionToken }),
  });
}

export function normalizeAccounts(value: unknown, currentUser?: AuthUser): SessionAccount[] {
  const raw = Array.isArray(value)
    ? value
    : value && typeof value === "object" && "sessions" in value && Array.isArray(value.sessions)
      ? value.sessions
      : [];

  const accounts: SessionAccount[] = raw.flatMap((item, index) => {
    if (!item || typeof item !== "object") return [];
    const entry = item as Record<string, unknown>;
    const user = (entry.user && typeof entry.user === "object" ? entry.user : entry) as Record<string, unknown>;
    const email = typeof user.email === "string" ? user.email : "";
    if (!email) return [];
    return [{
      id: typeof entry.id === "string" ? entry.id : `${email}-${index}`,
      name: typeof user.name === "string" && user.name ? user.name : email,
      email,
      username: typeof user.username === "string" ? user.username : "",
      onboardingComplete: user.onboardingStatus === "complete" || user.onboardingStatus === "completed" || user.onboardingStatus === undefined,
      sessionToken: typeof entry.sessionToken === "string"
        ? entry.sessionToken
        : entry.session && typeof entry.session === "object" && typeof (entry.session as Record<string, unknown>).token === "string"
          ? (entry.session as Record<string, unknown>).token as string
          : undefined,
    }];
  });

  if (currentUser?.email && !accounts.some((account) => account.email.toLowerCase() === currentUser.email.toLowerCase())) {
    accounts.unshift({
      id: currentUser.id ?? currentUser.email,
      name: currentUser.name || currentUser.email,
      email: currentUser.email,
      username: currentUser.username || "",
      onboardingComplete: currentUser.onboardingStatus === undefined || currentUser.onboardingStatus === "complete" || currentUser.onboardingStatus === "completed",
      sessionToken: undefined,
    });
  }

  return accounts;
}
