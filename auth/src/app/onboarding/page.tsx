"use client";

import { FormEvent, useEffect, useState } from "react";
import { createAuthClient } from "better-auth/client";

const authClient = createAuthClient();

export default function OnboardingPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(true);

  useEffect(() => { void checkOnboarding(); }, []);

  async function checkOnboarding() {
    const session = await authClient.getSession({ query: { disableCookieCache: true } });
    if (!session.data?.user) { window.location.replace("/"); return; }
    const response = await fetch("/api/auth-flow/status");
    const status = (await response.json()) as { onboardingComplete?: boolean; username?: string | null };
    if (status.onboardingComplete && status.username) { window.location.replace("/"); return; }
    setName(session.data.user.name === session.data.user.email.split("@")[0] ? "" : session.data.user.name);
    setEmail(session.data.user.email);
    setBusy(false);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setMessage("");
    const response = await fetch("/api/auth-flow/complete-profile", {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name, username, dateOfBirth }),
    });
    const result = (await response.json()) as { error?: string };
    if (!response.ok) { setMessage(result.error ?? "We could not save your profile."); setBusy(false); return; }
    window.location.replace("/");
  }

  return (
    <main className="shell">
      <header className="auth-header"><a className="brand" href="https://muflah.com/" aria-label="Muflah home">m</a><p className="auth-label">Muflah auth</p></header>
      <div className="auth-main"><section className="card" aria-labelledby="onboarding-title">
        <p className="eyebrow">Onboarding</p><h1 id="onboarding-title">Your platform profile</h1>
        <p className="intro">Choose how you’ll be known across Muflah products.</p><p className="email-context">Continuing with <strong>{email}</strong></p>
        <form onSubmit={handleSubmit}>
          <label>Name<input name="name" autoComplete="name" required value={name} onChange={(event) => setName(event.target.value)} /></label>
          <label>Username<input name="username" autoComplete="username" required pattern="[a-z0-9][a-z0-9._]{1,28}[a-z0-9]" value={username} onChange={(event) => setUsername(event.target.value.toLowerCase())} /></label>
          <label>Date of birth<input name="bday" type="date" autoComplete="bday" required value={dateOfBirth} onChange={(event) => setDateOfBirth(event.target.value)} /></label>
          <button type="submit" disabled={busy}>{busy ? "Working…" : "Continue"}</button>
        </form>
        {message && <p className="message" role="status">{message}</p>}
      </section></div>
    </main>
  );
}
