"use client";

import { FormEvent, useEffect, useState } from "react";
import { createAuthClient } from "better-auth/client";
import { emailOTPClient } from "better-auth/client/plugins";

const authClient = createAuthClient({ plugins: [emailOTPClient()] });
type Mode = "sign-in" | "sign-up";
type Method = "otp" | "password";

export default function HomePage() {
  const [mode, setMode] = useState<Mode>("sign-in");
  const [method, setMethod] = useState<Method>("otp");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [user, setUser] = useState<{ name: string; email: string } | null>(null);

  useEffect(() => { void loadSession(); }, []);

  async function loadSession() {
    const result = await authClient.getSession();
    if (result.data?.user) setUser({ name: result.data.user.name, email: result.data.user.email });
  }

  async function handlePasswordSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setMessage("");
    const result = mode === "sign-up"
      ? await authClient.signUp.email({ name, email, password })
      : await authClient.signIn.email({ email, password });
    setBusy(false);
    if (result.error) { setMessage(result.error.message ?? "Authentication failed."); return; }
    await loadSession();
  }

  async function handleSendOtp(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setMessage("");
    const result = await authClient.emailOtp.sendVerificationOtp({ email, type: "sign-in" });
    setBusy(false);
    if (result.error) { setMessage(result.error.message ?? "Email can't be sent."); return; }
    setOtpSent(true); setMessage("Check your email for the verification code.");
  }

  async function handleVerifyOtp(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setMessage("");
    const result = await authClient.signIn.emailOtp({ email, otp, name: mode === "sign-up" ? name : undefined });
    setBusy(false);
    if (result.error) { setMessage(result.error.message ?? "Verification failed."); return; }
    await loadSession();
  }

  async function handlePasswordResetRequest() {
    if (!email) { setMessage("Enter your email first."); return; }
    setBusy(true); setMessage("");
    const result = await authClient.requestPasswordReset({ email, redirectTo: `${window.location.origin}/reset-password` });
    setBusy(false);
    if (result.error) { setMessage(result.error.message ?? "Email can't be sent."); return; }
    setMessage("If that email exists, a password reset link has been sent.");
  }

  async function handleSignOut() {
    setBusy(true); await authClient.signOut(); setUser(null); setBusy(false);
  }

  if (user) return (
    <main className="shell"><section className="card" aria-labelledby="profile-title">
      <p className="eyebrow">Signed in</p><h1 id="profile-title">{user.name}</h1><p className="profile-email">{user.email}</p>
      <button type="button" disabled={busy} onClick={handleSignOut}>{busy ? "Signing out…" : "Sign out"}</button>
    </section></main>
  );

  return (
    <main className="shell"><section className="card" aria-labelledby="page-title">
      <p className="eyebrow">Auth service</p>
      <h1 id="page-title">{mode === "sign-in" ? "Sign in" : "Create account"}</h1>
      <p className="intro">Use a one-time email code or a password for this basic auth test.</p>
      <div className="mode-switch" role="group" aria-label="Authentication method">
        <button type="button" className={method === "otp" ? "selected" : "link-button"} onClick={() => setMethod("otp")}>Email code</button>
        <button type="button" className={method === "password" ? "selected" : "link-button"} onClick={() => setMethod("password")}>Password</button>
      </div>
      {method === "otp" ? (
        <form onSubmit={otpSent ? handleVerifyOtp : handleSendOtp}>
          {mode === "sign-up" && <label>Name<input autoComplete="name" required value={name} onChange={(event) => setName(event.target.value)} /></label>}
          <label>Email<input type="email" autoComplete="email" required value={email} onChange={(event) => setEmail(event.target.value)} /></label>
          {otpSent && <label>Verification code<input inputMode="numeric" autoComplete="one-time-code" required value={otp} onChange={(event) => setOtp(event.target.value)} /></label>}
          <button type="submit" disabled={busy}>{busy ? "Working…" : otpSent ? "Verify code" : "Send code"}</button>
        </form>
      ) : (
        <form onSubmit={handlePasswordSubmit}>
          {mode === "sign-up" && <label>Name<input autoComplete="name" required value={name} onChange={(event) => setName(event.target.value)} /></label>}
          <label>Email<input type="email" autoComplete="email" required value={email} onChange={(event) => setEmail(event.target.value)} /></label>
          <label>Password<input type="password" autoComplete={mode === "sign-in" ? "current-password" : "new-password"} minLength={8} required value={password} onChange={(event) => setPassword(event.target.value)} /></label>
          <button type="submit" disabled={busy}>{busy ? "Working…" : mode === "sign-in" ? "Sign in" : "Sign up"}</button>
        </form>
      )}
      {method === "password" && mode === "sign-in" && <button className="link-button" type="button" disabled={busy} onClick={handlePasswordResetRequest}>Forgot password?</button>}
      {message && <p className="message" role="status">{message}</p>}
      <button className="link-button" type="button" onClick={() => { setMode(mode === "sign-in" ? "sign-up" : "sign-in"); setOtpSent(false); setOtp(""); setMessage(""); }}>
        {mode === "sign-in" ? "Need an account? Sign up" : "Already have an account? Sign in"}
      </button>
    </section></main>
  );
}
