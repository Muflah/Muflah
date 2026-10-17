"use client";

import { useState } from "react";

export default function AccountActions() {
  const [busy, setBusy] = useState(false);

  async function signOut() {
    setBusy(true);
    await fetch("/api/auth/sign-out", { method: "POST", headers: { "Content-Type": "application/json" } });
    window.location.assign("/");
  }

  return <button className="account-logout" disabled={busy} onClick={signOut}>{busy ? "Signing out…" : "Log out ↗"}</button>;
}
