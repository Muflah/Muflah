"use client";

import { useEffect, useState } from "react";
import { createAuthClient } from "better-auth/client";

const authClient = createAuthClient();

export default function UsernamePage() {
  const [user, setUser] = useState<{ name: string; email: string } | null>(null);
  const [busy, setBusy] = useState(true);

  useEffect(() => { void loadSession(); }, []);

  async function loadSession() {
    const session = await authClient.getSession();
    if (!session.data?.user) { window.location.replace("/"); return; }
    const response = await fetch("/api/auth-flow/status");
    const status = (await response.json()) as { onboardingComplete?: boolean; username?: string | null };
    if (!status.onboardingComplete) { window.location.replace("/onboarding"); return; }
    if (status.username && window.location.pathname.slice(1) !== status.username) {
      window.location.replace(`/${encodeURIComponent(status.username)}`);
      return;
    }
    setUser({ name: session.data.user.name, email: session.data.user.email });
    setBusy(false);
  }

  async function handleSignOut() {
    setBusy(true);
    await authClient.signOut();
    window.location.replace("/");
  }

  if (!user) return null;
  return (
    <main className="shell">
      <header className="auth-header"><a className="brand" href="https://muflah.com/" aria-label="Muflah home">m</a><p className="auth-label">Muflah auth</p></header>
      <div className="auth-main"><section className="card" aria-labelledby="profile-title">
        <p className="eyebrow">Signed in</p><h1 id="profile-title">{user.name}</h1><p className="profile-email">{user.email}</p>
        <button type="button" disabled={busy} onClick={handleSignOut}>{busy ? "Signing out…" : "Sign out"}</button>
      </section></div>
    </main>
  );
}
