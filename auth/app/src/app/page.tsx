"use client";

import { FormEvent, useState } from "react";

type Flow = "sign-in" | "sign-up";

export default function HomePage() {
  const [email, setEmail] = useState("");
  const [flow, setFlow] = useState<Flow | null>(null);
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  async function continueWithEmail(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setMessage("");
    try {
      const response = await fetch("/api/identity/lookup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error ?? "Unable to continue");
      setFlow(result.exists ? "sign-in" : "sign-up");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to continue");
    } finally {
      setBusy(false);
    }
  }

  async function submitCredentials(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setMessage("");
    const endpoint = flow === "sign-in" ? "/api/auth/sign-in/email" : "/api/auth/sign-up/email";
    const body = flow === "sign-in" ? { email, password } : { email, password, name, username };
    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result.message ?? "Authentication failed");
      setMessage("Success. Check your email if verification is required.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Authentication failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main>
      <section className="card" aria-live="polite">
        <h1>{flow ? (flow === "sign-in" ? "Welcome back" : "Create your account") : "Continue to your account"}</h1>
        <p>{flow ? `Continue with ${email}.` : "Enter your email to continue."}</p>
        {!flow ? (
          <form onSubmit={continueWithEmail}>
            <label htmlFor="email">Email address</label>
            <input id="email" type="email" autoComplete="email" required value={email} onChange={(event) => setEmail(event.target.value)} />
            <button disabled={busy}>{busy ? "Checking…" : "Continue"}</button>
          </form>
        ) : (
          <form onSubmit={submitCredentials}>
            {flow === "sign-up" && <>
              <label htmlFor="name">Name</label>
              <input id="name" autoComplete="name" required value={name} onChange={(event) => setName(event.target.value)} />
              <label htmlFor="username">Username</label>
              <input id="username" autoComplete="username" required value={username} onChange={(event) => setUsername(event.target.value)} />
            </>}
            <label htmlFor="password">Password</label>
            <input id="password" type="password" autoComplete={flow === "sign-in" ? "current-password" : "new-password"} required value={password} onChange={(event) => setPassword(event.target.value)} />
            <button disabled={busy}>{busy ? "Working…" : flow === "sign-in" ? "Sign in" : "Create account"}</button>
            <button type="button" onClick={() => setFlow(null)}>Use a different email</button>
          </form>
        )}
        {message && <p className="error">{message}</p>}
      </section>
    </main>
  );
}
