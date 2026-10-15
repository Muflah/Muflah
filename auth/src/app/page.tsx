"use client";

import { FormEvent, useEffect, useState } from "react";
import { createAuthClient } from "better-auth/client";
import { emailOTPClient, twoFactorClient } from "better-auth/client/plugins";
import { isStrongPassword, passwordRequirements } from "../config/password";

const authClient = createAuthClient({
  plugins: [emailOTPClient(), twoFactorClient()],
});

type Mode = "sign-in" | "sign-up";
type Stage = "email" | "login-password" | "login-otp" | "signup-otp" | "signup-password";

export default function HomePage() {
  const [mode, setMode] = useState<Mode>("sign-in");
  const [stage, setStage] = useState<Stage>("email");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirmation, setPasswordConfirmation] = useState("");
  const [otp, setOtp] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [user, setUser] = useState<{ name: string; email: string } | null>(null);

  useEffect(() => { void loadSession(); }, []);

  async function loadSession() {
    const result = await authClient.getSession();
    if (result.data?.user) setUser({ name: result.data.user.name, email: result.data.user.email });
  }

  function resetFlow(nextMode: Mode = mode) {
    setMode(nextMode);
    setStage("email");
    setPassword("");
    setPasswordConfirmation("");
    setOtp("");
    setMessage("");
  }

  async function handleEmailSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setMessage("");

    if (mode === "sign-up") {
      const result = await authClient.emailOtp.sendVerificationOtp({ email, type: "sign-in" });
      setBusy(false);
      if (result.error) { setMessage("We could not send the email. Please try again."); return; }
      setStage("signup-otp");
      setMessage("We have sent you an email.");
      return;
    }

    setBusy(false);
    setStage("login-password");
  }

  async function handleLoginPassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setMessage("");
    const result = await authClient.signIn.email({ email, password });
    setBusy(false);

    if (result.error) { setMessage("We could not sign you in with those details."); return; }
    if ((result.data as { twoFactorRedirect?: boolean } | undefined)?.twoFactorRedirect) {
      const otpResult = await authClient.twoFactor.sendOtp();
      if (otpResult.error) { setMessage("We could not send the email. Please try again."); return; }
      setStage("login-otp");
      setMessage("We have sent you an email.");
      return;
    }
    await loadSession();
  }

  async function handleLoginOtp(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setMessage("");
    const result = await authClient.twoFactor.verifyOtp({ code: otp, trustDevice: true });
    setBusy(false);
    if (result.error) { setMessage("That code is invalid or expired. Please request a new one."); return; }
    await loadSession();
  }

  async function handleSignupOtp(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setMessage("");
    const response = await fetch("/api/auth-flow/verify-signup-otp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, otp }),
    });
    const result = (await response.json()) as { error?: string };
    setBusy(false);
    if (!response.ok) { setMessage(result.error ?? "That code is invalid or expired. Please request a new one."); return; }
    setStage("signup-password");
    setMessage("Email verified. Create your password.");
  }

  async function handleSignupPassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setMessage("");
    if (!isStrongPassword(password)) { setBusy(false); setMessage(passwordRequirements); return; }
    if (password !== passwordConfirmation) { setBusy(false); setMessage("The passwords do not match."); return; }

    const response = await fetch("/api/auth-flow/finish-signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, password }),
    });
    const result = (await response.json()) as { error?: string };
    setBusy(false);
    if (!response.ok) { setMessage(result.error ?? "We could not finish creating the account."); return; }
    await loadSession();
  }

  async function handlePasswordResetRequest() {
    setBusy(true); setMessage("");
    const result = await authClient.requestPasswordReset({ email, redirectTo: `${window.location.origin}/reset-password` });
    setBusy(false);
    if (result.error) { setMessage("We could not send the email. Please try again."); return; }
    setMessage("If that email exists, a password reset link has been sent.");
  }

  async function handleSignOut() {
    setBusy(true); await authClient.signOut(); setUser(null); setBusy(false); resetFlow();
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
      <p className="intro">
        {stage === "email" && "Enter your email to continue."}
        {stage === "login-password" && "Enter your password."}
        {stage === "login-otp" && "We have sent you an email."}
        {stage === "signup-otp" && "We have sent you an email."}
        {stage === "signup-password" && "Create a password for your account."}
      </p>

      {stage === "email" && <form onSubmit={handleEmailSubmit}>
        <label>Email<input type="email" autoComplete="email" required value={email} onChange={(event) => setEmail(event.target.value.trim().toLowerCase())} /></label>
        <button type="submit" disabled={busy}>{busy ? "Working…" : "Next"}</button>
      </form>}

      {stage === "login-password" && <form onSubmit={handleLoginPassword}>
        <label>Password<input type="password" autoComplete="current-password" required value={password} onChange={(event) => setPassword(event.target.value)} /></label>
        <button type="submit" disabled={busy}>{busy ? "Working…" : "Continue"}</button>
      </form>}

      {stage === "login-otp" && <form onSubmit={handleLoginOtp}>
        <label>Verification code<input inputMode="numeric" autoComplete="one-time-code" required value={otp} onChange={(event) => setOtp(event.target.value)} /></label>
        <button type="submit" disabled={busy}>{busy ? "Working…" : "Verify code"}</button>
      </form>}

      {stage === "signup-otp" && <form onSubmit={handleSignupOtp}>
        <label>Verification code<input inputMode="numeric" autoComplete="one-time-code" required value={otp} onChange={(event) => setOtp(event.target.value)} /></label>
        <button type="submit" disabled={busy}>{busy ? "Working…" : "Verify code"}</button>
      </form>}

      {stage === "signup-password" && <form onSubmit={handleSignupPassword}>
        <label>Name<input autoComplete="name" required value={name} onChange={(event) => setName(event.target.value)} /></label>
        <label>Password<input type="password" autoComplete="new-password" required value={password} onChange={(event) => setPassword(event.target.value)} /></label>
        <label>Confirm password<input type="password" autoComplete="new-password" required value={passwordConfirmation} onChange={(event) => setPasswordConfirmation(event.target.value)} /></label>
        <p className="hint">{passwordRequirements}</p>
        <button type="submit" disabled={busy}>{busy ? "Working…" : "Create account"}</button>
      </form>}

      {stage === "login-password" && <button className="link-button" type="button" disabled={busy} onClick={handlePasswordResetRequest}>Forgot password?</button>}
      {message && <p className="message" role="status">{message}</p>}

      {stage === "email" && <button className="link-button" type="button" onClick={() => resetFlow(mode === "sign-in" ? "sign-up" : "sign-in")}>
        {mode === "sign-in" ? "Don’t have an account? Create one" : "Already have an account? Sign in"}
      </button>}
      {stage !== "email" && <button className="link-button" type="button" onClick={() => resetFlow()}>Start over</button>}
    </section></main>
  );
}
