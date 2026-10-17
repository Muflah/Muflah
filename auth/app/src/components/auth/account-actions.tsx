"use client";

import { useState } from "react";

export default function AccountActions() {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function signOut() {
    setBusy(true);
    setError("");
    try {
      const response = await fetch("/api/auth/sign-out", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({}),
        cache: "no-store",
      });
      if (!response.ok) throw new Error("Unable to sign out. Please try again.");
      window.location.replace("/");
    } catch (signOutError) {
      setError(signOutError instanceof Error ? signOutError.message : "Unable to sign out. Please try again.");
      setBusy(false);
    }
  }

  return <div className="account-logout-wrap"><button className="account-logout" type="button" disabled={busy} onClick={signOut}>{busy ? "Signing out…" : "Log out ↗"}</button>{error && <span className="account-logout-error" role="alert">{error}</span>}</div>;
}
