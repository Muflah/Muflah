"use client";

import { useState } from "react";
import { activateSession, type SessionAccount } from "@/lib/auth-client";

export default function AccountSwitcher({ authUrl, currentEmail, accounts }: { authUrl: string; currentEmail: string; accounts: SessionAccount[] }) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  const current = accounts.find((account) => account.email.toLowerCase() === currentEmail.toLowerCase());
  const displayName = current?.name || currentEmail;

  async function selectAccount(account: SessionAccount) {
    if (!account.sessionToken || account.email.toLowerCase() === currentEmail.toLowerCase()) return;
    setBusy(true);
    setMessage("");
    try {
      await activateSession(account.sessionToken);
      window.location.reload();
    } catch {
      setMessage("That account session is no longer available.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="switcher">
      <button className="switcher-trigger" type="button" aria-expanded={open} onClick={() => setOpen((value) => !value)}>
        <span className="avatar">{displayName.slice(0, 1).toUpperCase()}</span>
        <span className="switcher-label"><strong>{displayName}</strong><small>{current?.username ? `@${current.username}` : currentEmail}</small></span>
        <span aria-hidden="true">⌄</span>
      </button>
      {open && (
        <div className="switcher-menu" role="menu">
          <span className="eyebrow">Available accounts</span>
          {accounts.map((account) => (
            <button className="switcher-account" type="button" role="menuitem" key={account.id} disabled={busy || !account.sessionToken} onClick={() => selectAccount(account)}>
              <span className="avatar avatar-small">{account.name.slice(0, 1).toUpperCase()}</span>
              <span><strong>{account.name}</strong><small>{account.email}</small></span>
              <em>{account.email.toLowerCase() === currentEmail.toLowerCase() ? "Current" : account.onboardingComplete ? "Switch" : "Finish setup"}</em>
            </button>
          ))}
          <a className="switcher-add" href={authUrl}>+ Add account ↗</a>
          {message && <p className="switcher-message">{message}</p>}
        </div>
      )}
    </div>
  );
}
