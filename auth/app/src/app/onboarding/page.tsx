"use client";

import { FormEvent, useEffect, useState } from "react";

export default function OnboardingPage() {
  const [username, setUsername] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);

  useEffect(() => {
    fetch("/api/auth/get-session", { credentials: "include", cache: "no-store" })
      .then((response) => response.json())
      .then((result) => {
        if (!result?.user) { window.location.replace("/"); return; }
        if (result.user.onboardingStatus === "complete" && result.user.username) { window.location.replace(`/${encodeURIComponent(result.user.username)}`); return; }
        setCheckingSession(false);
      })
      .catch(() => window.location.replace("/"));
  }, []);

  async function completeOnboarding(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setMessage("");
    try {
      const response = await fetch("/api/onboarding/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username }),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result.error ?? "Unable to complete onboarding");
      window.location.assign(`/${encodeURIComponent(result.username)}`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to complete onboarding");
    } finally {
      setBusy(false);
    }
  }

  if (checkingSession) return <div className="auth-shell"><main className="auth-main"><p className="micro">Checking your session…</p></main></div>;

  return (
    <div className="auth-shell">
      <header className="auth-header">
        <a className="brand" href="https://muflah.com/" aria-label="Muflah home">m</a>
        <span className="auth-label">Account setup</span>
      </header>
      <main className="auth-main">
        <section className="auth-card" aria-live="polite">
          <p className="micro">One last step</p>
          <h1>Choose your username.</h1>
          <p className="intro">Your username is your public identity across Muflah. It can use lowercase letters, numbers, and underscores.</p>
          <form className="auth-form" onSubmit={completeOnboarding}>
            <label htmlFor="username">Username</label>
            <input id="username" autoComplete="username" autoCapitalize="none" pattern="[a-z0-9_]+" minLength={3} maxLength={30} required value={username} onChange={(event) => setUsername(event.target.value.toLowerCase())} />
            <div className="auth-actions"><button className="auth-button" disabled={busy}>{busy ? "Saving…" : "Finish setup ↗"}</button></div>
          </form>
          {message && <p className="notice error">{message}</p>}
        </section>
      </main>
      <footer className="auth-footer"><p>© 2026 Muflah Ul Furqan.</p><p>Authentication service</p></footer>
    </div>
  );
}
