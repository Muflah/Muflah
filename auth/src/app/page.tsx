"use client";

import { FormEvent, useState } from "react";
import { createAuthClient } from "better-auth/client";

const authClient = createAuthClient();

type Mode = "sign-in" | "sign-up";

export default function HomePage() {
  const [mode, setMode] = useState<Mode>("sign-in");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setMessage("");

    const result =
      mode === "sign-up"
        ? await authClient.signUp.email({ name, email, password })
        : await authClient.signIn.email({ email, password });

    setBusy(false);
    setMessage(
      result.error
        ? result.error.message ?? "Authentication failed."
        : mode === "sign-up"
          ? "Account created and signed in."
          : "Signed in successfully.",
    );
  }

  return (
    <main className="shell">
      <section className="card" aria-labelledby="page-title">
        <p className="eyebrow">Auth service</p>
        <h1 id="page-title">{mode === "sign-in" ? "Sign in" : "Create account"}</h1>
        <p className="intro">
          Basic Better Auth signup and login test surface.
        </p>

        <form onSubmit={handleSubmit}>
          {mode === "sign-up" && (
            <label>
              Name
              <input
                autoComplete="name"
                required
                value={name}
                onChange={(event) => setName(event.target.value)}
              />
            </label>
          )}

          <label>
            Email
            <input
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
            />
          </label>

          <label>
            Password
            <input
              type="password"
              autoComplete={mode === "sign-in" ? "current-password" : "new-password"}
              minLength={8}
              required
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
          </label>

          <button type="submit" disabled={busy}>
            {busy ? "Working…" : mode === "sign-in" ? "Sign in" : "Sign up"}
          </button>
        </form>

        {message && (
          <p className="message" role="status">
            {message}
          </p>
        )}

        <button
          className="link-button"
          type="button"
          onClick={() => {
            setMode(mode === "sign-in" ? "sign-up" : "sign-in");
            setMessage("");
          }}
        >
          {mode === "sign-in"
            ? "Need an account? Sign up"
            : "Already have an account? Sign in"}
        </button>
      </section>
    </main>
  );
}
