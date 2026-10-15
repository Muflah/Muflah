"use client";

import { FormEvent, useEffect, useState } from "react";
import { createAuthClient } from "better-auth/client";
import { emailOTPClient, twoFactorClient, usernameClient } from "better-auth/client/plugins";
import { isStrongPassword, passwordRequirements } from "../config/password";

const authClient = createAuthClient({
  plugins: [emailOTPClient(), twoFactorClient(), usernameClient()],
});

function PasswordField({
  label,
  name,
  autoComplete,
  value,
  onChange,
  visible,
  onToggle,
}: {
  label: string;
  name: string;
  autoComplete: "current-password" | "new-password";
  value: string;
  onChange: (value: string) => void;
  visible: boolean;
  onToggle: () => void;
}) {
  return (
    <label>{label}<span className="password-field">
      <input name={name} type={visible ? "text" : "password"} autoComplete={autoComplete} required value={value} onChange={(event) => onChange(event.target.value)} />
      <button className="password-toggle" type="button" aria-label={visible ? `Hide ${label.toLowerCase()}` : `Show ${label.toLowerCase()}`} onClick={onToggle}>
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M2.5 12s3.5-6 9.5-6 9.5 6 9.5 6-3.5 6-9.5 6-9.5-6-9.5-6Z" /><circle cx="12" cy="12" r="2.5" /></svg>
      </button>
    </span></label>
  );
}

type Mode = "sign-in" | "sign-up";
type Stage = "email" | "email-otp" | "login-password" | "login-otp" | "signup-password" | "profile";

export default function HomePage() {
  const [mode, setMode] = useState<Mode>("sign-in");
  const [stage, setStage] = useState<Stage>("email");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirmation, setPasswordConfirmation] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showPasswordConfirmation, setShowPasswordConfirmation] = useState(false);
  const [username, setUsername] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [otp, setOtp] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [user, setUser] = useState<{ name: string; email: string } | null>(null);

  useEffect(() => { void loadSession(); }, []);
  useEffect(() => {
    if (new URLSearchParams(window.location.search).get("mode") === "add-account") setMode("sign-up");
  }, []);
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = window.setInterval(() => setResendCooldown((value) => Math.max(0, value - 1)), 1000);
    return () => window.clearInterval(timer);
  }, [resendCooldown]);

  async function loadSession() {
    const addingAccount = new URLSearchParams(window.location.search).get("mode") === "add-account";
    if (addingAccount) {
      setMode("sign-up");
      setStage("email");
      return;
    }

    const result = await authClient.getSession();
    if (!result.data?.user) return;
    const statusResponse = await fetch("/api/auth-flow/status");
    const status = (await statusResponse.json()) as { hasCredential?: boolean; onboardingComplete?: boolean; username?: string | null };
    if (status.hasCredential && !status.onboardingComplete) {
      window.location.replace("/onboarding");
      return;
    }
    if (!status.hasCredential) {
      setStage("signup-password");
      return;
    }
    if (status.username) window.location.replace(`/${encodeURIComponent(status.username)}`);
  }

  function resetFlow(nextMode: Mode = mode) {
    setMode(nextMode);
    setStage("email");
    setPassword("");
    setPasswordConfirmation("");
    setShowPassword(false);
    setShowPasswordConfirmation(false);
    setUsername("");
    setDateOfBirth("");
    setOtp("");
    setMessage("");
    setResendCooldown(0);
  }

  async function handleEmailSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setMessage("");
    try {
      const controller = new AbortController();
      const timeout = window.setTimeout(() => controller.abort(), 15000);
      const response = await fetch("/api/auth-flow/request-email-otp", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email }), signal: controller.signal });
      window.clearTimeout(timeout);
      if (!response.ok) { setMessage("We could not send the email. Please try again."); return; }
      setStage("email-otp"); setMessage("We have sent you an email."); setResendCooldown(30);
    } catch { setMessage("We could not send the email. Please try again."); }
    finally { setBusy(false); }
  }

  async function handleLoginPassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setMessage("");
    try {
      const response = await fetch("/api/auth-flow/verify-password", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ password }) });
      const result = (await response.json()) as { error?: string };
      if (!response.ok) { setMessage(result.error ?? "We could not sign you in with those details."); return; }
      await loadSession();
    } catch { setMessage("We could not sign you in with those details."); }
    finally { setBusy(false); }
  }

  async function handleLoginOtp(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setMessage("");
    const result = await authClient.twoFactor.verifyOtp({ code: otp, trustDevice: true });
    setBusy(false);
    if (result.error) { setMessage("That code is invalid or expired. Please request a new one."); return; }
    await loadSession();
  }

  async function handleResendOtp() {
    if (busy || resendCooldown > 0) return;
    setBusy(true); setMessage("");
    if (stage === "login-otp") {
      const result = await authClient.twoFactor.sendOtp();
      setBusy(false);
      if (result.error) { setMessage("We could not send the email. Please try again."); return; }
    } else {
      const response = await fetch("/api/auth-flow/request-email-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      setBusy(false);
      if (!response.ok) { setMessage("We could not send the email. Please try again."); return; }
    }
    setResendCooldown(30);
    setMessage("We have sent you a new email.");
  }

  async function handleEmailOtp(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setMessage("");
    const response = await fetch("/api/auth-flow/verify-signup-otp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, otp }),
    });
    const result = (await response.json()) as { error?: string };
    setBusy(false);
    if (!response.ok) { setMessage(result.error ?? "That code is invalid or expired. Please request a new one."); return; }
    const statusResponse = await fetch("/api/auth-flow/status");
    const status = (await statusResponse.json()) as { hasCredential?: boolean };
    if (status.hasCredential) {
      setStage("login-password");
      setMessage("Email verified. Enter your password.");
    } else {
      setStage("signup-password");
      setMessage("Email verified. Create your password.");
    }
  }

  async function handleSignupPassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setMessage("");
    if (!isStrongPassword(password)) { setBusy(false); setMessage(passwordRequirements); return; }
    if (password !== passwordConfirmation) { setBusy(false); setMessage("The passwords do not match."); return; }

    try {
      const controller = new AbortController();
      const timeout = window.setTimeout(() => controller.abort(), 15000);
      const response = await fetch("/api/auth-flow/finish-signup", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ password }), signal: controller.signal });
      window.clearTimeout(timeout);
      const result = (await response.json()) as { error?: string };
      if (!response.ok) { setMessage(result.error ?? "We could not finish creating the account."); return; }
      window.location.replace("/onboarding");
    } catch { setMessage("We could not finish creating the account. Please try again."); }
    finally { setBusy(false); }
  }

  async function handleProfileSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setMessage("");
    const response = await fetch("/api/auth-flow/complete-profile", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, username, dateOfBirth }),
    });
    const result = (await response.json()) as { error?: string };
    setBusy(false);
    if (!response.ok) { setMessage(result.error ?? "We could not save your profile."); return; }
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
    <main className="shell">
      <header className="auth-header"><a className="brand" href="https://muflah.com/" aria-label="Muflah home">m</a><p className="auth-label">Muflah auth</p></header>
      <div className="auth-main"><section className="card" aria-labelledby="profile-title">
        <p className="eyebrow">Signed in</p><h1 id="profile-title">{user.name}</h1><p className="profile-email">{user.email}</p>
        <button type="button" disabled={busy} onClick={handleSignOut}>{busy ? "Signing out…" : "Sign out"}</button>
      </section></div>
    </main>
  );

  return (
    <main className="shell">
      <header className="auth-header"><a className="brand" href="https://muflah.com/" aria-label="Muflah home">m</a><p className="auth-label">Muflah auth</p></header>
      <div className="auth-main"><section className="card" aria-labelledby="page-title">
      <p className="eyebrow">Auth service</p>
      <h1 id="page-title">{mode === "sign-in" ? "Sign in" : "Create account"}</h1>
      <p className="intro">
        {stage === "email" && "Enter your email to continue."}
        {stage === "login-password" && "Enter your password."}
        {stage === "login-otp" && "We have sent you an email."}
        {stage === "email-otp" && "We have sent you an email."}
        {stage === "signup-password" && "Create a password for your account."}
        {stage === "profile" && "Finish your Muflah profile."}
      </p>
      {stage !== "email" && <p className="email-context">Continuing with <strong>{email}</strong></p>}

      {stage === "email" && <form onSubmit={handleEmailSubmit}>
        <label>Email<input name="email" type="email" autoComplete="email" required value={email} onChange={(event) => setEmail(event.target.value.trim().toLowerCase())} /></label>
        <button type="submit" disabled={busy}>{busy ? "Working…" : "Next"}</button>
      </form>}

      {stage === "login-password" && <form onSubmit={handleLoginPassword}>
        <label>Email<input name="username" type="email" autoComplete="username" value={email} readOnly /></label>
        <PasswordField label="Password" name="password" autoComplete="current-password" value={password} onChange={setPassword} visible={showPassword} onToggle={() => setShowPassword((value) => !value)} />
        <button type="submit" disabled={busy}>{busy ? "Working…" : "Continue"}</button>
      </form>}

      {stage === "login-otp" && <form onSubmit={handleLoginOtp}>
        <label>Verification code<input name="otp" inputMode="numeric" autoComplete="one-time-code" required value={otp} onChange={(event) => setOtp(event.target.value)} /></label>
        <button type="submit" disabled={busy}>{busy ? "Working…" : "Verify code"}</button>
      </form>}

      {stage === "email-otp" && <form onSubmit={handleEmailOtp}>
        <label>Verification code<input name="otp" inputMode="numeric" autoComplete="one-time-code" required value={otp} onChange={(event) => setOtp(event.target.value)} /></label>
        <button type="submit" disabled={busy}>{busy ? "Working…" : "Verify code"}</button>
      </form>}

      {(stage === "email-otp" || stage === "login-otp") && <button className="link-button" type="button" disabled={busy || resendCooldown > 0} onClick={handleResendOtp}>
        {resendCooldown > 0 ? `Resend code in ${resendCooldown}s` : "Didn’t receive it? Resend code"}
      </button>}

      {stage === "signup-password" && <form onSubmit={handleSignupPassword}>
        <label>Email<input name="username" type="email" autoComplete="username" value={email} readOnly /></label>
        <PasswordField label="Password" name="password" autoComplete="new-password" value={password} onChange={setPassword} visible={showPassword} onToggle={() => setShowPassword((value) => !value)} />
        <PasswordField label="Confirm password" name="password-confirmation" autoComplete="new-password" value={passwordConfirmation} onChange={setPasswordConfirmation} visible={showPasswordConfirmation} onToggle={() => setShowPasswordConfirmation((value) => !value)} />
        <p className="hint">{passwordRequirements}</p>
        <button type="submit" disabled={busy}>{busy ? "Working…" : "Create account"}</button>
      </form>}

      {stage === "profile" && <form onSubmit={handleProfileSubmit}>
        <label>Name<input name="name" autoComplete="name" required value={name} onChange={(event) => setName(event.target.value)} /></label>
        <label>Username<input name="username" autoComplete="username" required pattern="[a-z0-9][a-z0-9._]{1,28}[a-z0-9]" value={username} onChange={(event) => setUsername(event.target.value.toLowerCase())} /></label>
        <label>Date of birth<input name="bday" type="date" autoComplete="bday" required value={dateOfBirth} onChange={(event) => setDateOfBirth(event.target.value)} /></label>
        <button type="submit" disabled={busy}>{busy ? "Working…" : "Finish profile"}</button>
      </form>}

      {stage === "login-password" && <button className="link-button" type="button" disabled={busy} onClick={handlePasswordResetRequest}>Forgot password?</button>}
      {message && <p className="message" role="status">{message}</p>}

      {stage === "email" && <button className="link-button" type="button" onClick={() => resetFlow(mode === "sign-in" ? "sign-up" : "sign-in")}>
        {mode === "sign-in" ? "Don’t have an account? Create one" : "Already have an account? Sign in"}
      </button>}
      {stage !== "email" && stage !== "profile" && <button className="link-button" type="button" onClick={() => resetFlow()}>Start over</button>}
      </section></div>
    </main>
  );
}
