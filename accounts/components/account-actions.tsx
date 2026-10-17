"use client";
import { useState } from "react";
import { buildAuthUrl, revokeSession } from "@/lib/auth-client";
import { publishSessionEvent } from "@/components/session-sync";
export default function AccountActions({ authUrl, currentToken }: { authUrl: string; currentToken?: string }) {
  const [busy, setBusy] = useState(false); const [error, setError] = useState("");
  async function signOut() {
    if (!currentToken) return; setBusy(true); setError("");
    try { await revokeSession(currentToken); publishSessionEvent("account-logged-out"); window.location.replace(buildAuthUrl(authUrl, `${window.location.origin}/`)); }
    catch (signOutError) { setError(signOutError instanceof Error ? signOutError.message : "Unable to sign out. Please try again."); setBusy(false); }
  }
  return <div className="account-logout-wrap"><button className="account-logout" type="button" disabled={busy || !currentToken} onClick={signOut}>{busy ? "Signing out…" : "Log out account ↗"}</button>{error && <span className="account-logout-error" role="alert">{error}</span>}</div>;
}
