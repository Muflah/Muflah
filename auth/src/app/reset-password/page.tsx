"use client";

import { FormEvent, useEffect, useState } from "react";
import { createAuthClient } from "better-auth/client";

const authClient = createAuthClient();

export default function ResetPasswordPage() {
  const [token, setToken] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setToken(new URLSearchParams(window.location.search).get("token") ?? "");
  }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setMessage("");
    const result = await authClient.resetPassword({ newPassword: password, token });
    setBusy(false);
    setMessage(result.error ? result.error.message ?? "Password reset failed." : "Password reset. You can sign in now.");
  }

  return (
    <main className="shell"><section className="card" aria-labelledby="reset-title">
      <p className="eyebrow">Auth service</p><h1 id="reset-title">Reset password</h1>
      <form onSubmit={handleSubmit}>
        <label>New password<input type="password" minLength={8} required value={password} onChange={(event) => setPassword(event.target.value)} /></label>
        <button type="submit" disabled={busy || !token}>{busy ? "Working…" : "Reset password"}</button>
      </form>
      {message && <p className="message" role="status">{message}</p>}
    </section></main>
  );
}
