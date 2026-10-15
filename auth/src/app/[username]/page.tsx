"use client";

import { useEffect, useState } from "react";
import { createAuthClient } from "better-auth/client";
import { multiSessionClient } from "better-auth/client/plugins";
import { announceSessionSwitch } from "../session-sync";

const authClient = createAuthClient({ plugins: [multiSessionClient()] });

type AccountSession = {
  name: string;
  email: string;
  username: string | null;
  sessionToken?: string;
  active?: boolean;
};

export default function UsernamePage() {
  const [user, setUser] = useState<{ name: string; email: string } | null>(null);
  const [accounts, setAccounts] = useState<AccountSession[]>([]);
  const [busy, setBusy] = useState(true);

  useEffect(() => { void loadSession(); }, []);

  async function loadSession() {
    const session = await authClient.getSession();
    if (!session.data?.user) { window.location.replace("/"); return; }
    const currentUser = session.data.user;
    const response = await fetch("/api/auth-flow/status");
    const status = (await response.json()) as { onboardingComplete?: boolean; username?: string | null };
    if (!status.onboardingComplete) { window.location.replace("/onboarding"); return; }
    if (status.username && window.location.pathname.slice(1) !== status.username) {
      window.location.replace(`/${encodeURIComponent(status.username)}`);
      return;
    }
    setUser({ name: currentUser.name, email: currentUser.email });
    const deviceSessions = await authClient.multiSession.listDeviceSessions();
    const otherAccounts = (deviceSessions.data ?? []).map((item) => ({
      name: item.user.name,
      email: item.user.email,
      username: (item.user as typeof item.user & { username?: string | null }).username ?? null,
      sessionToken: item.session.token,
    }));
    setAccounts([
      { name: currentUser.name, email: currentUser.email, username: status.username ?? null, active: true },
      ...otherAccounts.filter((item) => item.email !== currentUser.email),
    ]);
    setBusy(false);
  }

  async function switchAccount(account: AccountSession) {
    if (!account.sessionToken || account.active) return;
    setBusy(true);
    const result = await authClient.multiSession.setActive({ sessionToken: account.sessionToken });
    if (result.error) { setBusy(false); return; }
    announceSessionSwitch();
    window.location.reload();
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
        {accounts.length > 0 && <div className="account-switcher">
          <p className="hint">Accounts</p>
          {accounts.map((account) => <button className="link-button" type="button" key={account.email} disabled={busy || account.active} onClick={() => void switchAccount(account)}>
            {account.username ? `@${account.username}` : account.email}{account.active ? " (current)" : ""}
          </button>)}
          <a className="link-button" href="/?mode=add-account">Add another account</a>
        </div>}
        <button type="button" disabled={busy} onClick={handleSignOut}>{busy ? "Signing out…" : "Sign out"}</button>
      </section></div>
    </main>
  );
}
