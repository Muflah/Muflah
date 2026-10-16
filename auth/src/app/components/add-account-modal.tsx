"use client";

import { FormEvent, useState } from "react";
import { createAuthClient } from "better-auth/client";
import { isStrongPassword, passwordRequirements } from "../../config/password";

const authClient = createAuthClient();
type Stage = "email" | "email-otp" | "login-password" | "signup-password";

export default function AddAccountModal({ onClose, onComplete }: { onClose: () => void; onComplete: () => Promise<void> }) {
  const [stage, setStage] = useState<Stage>("email");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  async function requestOtp(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setMessage("");
    const response = await fetch("/api/auth-flow/request-email-otp", {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email }),
    });
    setBusy(false);
    if (!response.ok) { setMessage("We could not send the email. Please try again."); return; }
    setStage("email-otp"); setMessage("We have sent you an email.");
  }

  async function verifyEmail(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setMessage("");
    const response = await fetch("/api/auth-flow/verify-signup-otp", {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email, otp }),
    });
    const result = (await response.json()) as { error?: string };
    setBusy(false);
    if (!response.ok) { setMessage(result.error ?? "That code is invalid or expired."); return; }
    const hasCredential = response.headers.get("X-Auth-Has-Credential") === "true";
    setStage(hasCredential ? "login-password" : "signup-password");
    setMessage(hasCredential ? "Email verified. Enter your password." : "Email verified. Create your password.");
  }

  async function finishPassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setMessage("");
    if (stage === "signup-password" && !isStrongPassword(password)) { setBusy(false); setMessage(passwordRequirements); return; }
    if (stage === "signup-password" && password !== confirmation) { setBusy(false); setMessage("The passwords do not match."); return; }
    const response = await fetch(stage === "signup-password" ? "/api/auth-flow/finish-signup" : "/api/auth-flow/verify-password", {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ password }),
    });
    const result = (await response.json()) as { error?: string };
    setBusy(false);
    if (!response.ok) { setMessage(result.error ?? "We could not finish signing in."); return; }
    await onComplete();
  }

  return <div className="modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
    <section className="modal card" role="dialog" aria-modal="true" aria-labelledby="add-account-title">
      <button className="modal-close" type="button" aria-label="Close" onClick={onClose}>×</button>
      <p className="eyebrow">Account switcher</p><h2 id="add-account-title">Add another account</h2>
      <p className="intro">This account will be available in this browser.</p>
      {stage !== "email" && <p className="email-context">Continuing with <strong>{email}</strong></p>}
      {stage === "email" && <form onSubmit={requestOtp}>
        <label>Email<input name="email" type="email" autoComplete="email" required value={email} onChange={(event) => setEmail(event.target.value.trim().toLowerCase())} /></label>
        <button type="submit" disabled={busy}>{busy ? "Working…" : "Next"}</button>
      </form>}
      {stage === "email-otp" && <form onSubmit={verifyEmail}>
        <label>Verification code<input name="otp" inputMode="numeric" autoComplete="one-time-code" required value={otp} onChange={(event) => setOtp(event.target.value)} /></label>
        <button type="submit" disabled={busy}>{busy ? "Working…" : "Verify code"}</button>
      </form>}
      {(stage === "login-password" || stage === "signup-password") && <form onSubmit={finishPassword}>
        <label>Email<input name="username" type="email" autoComplete="username" value={email} readOnly /></label>
        <label>Password<input name="password" type="password" autoComplete={stage === "signup-password" ? "new-password" : "current-password"} required value={password} onChange={(event) => setPassword(event.target.value)} /></label>
        {stage === "signup-password" && <>
          <label>Confirm password<input name="password-confirmation" type="password" autoComplete="new-password" required value={confirmation} onChange={(event) => setConfirmation(event.target.value)} /></label>
          <p className="hint">{passwordRequirements}</p>
        </>}
        <button type="submit" disabled={busy}>{busy ? "Working…" : stage === "signup-password" ? "Create account" : "Sign in"}</button>
      </form>}
      {message && <p className="message" role="status">{message}</p>}
      {stage !== "email" && <button className="link-button" type="button" disabled={busy} onClick={() => { setStage("email"); setOtp(""); setPassword(""); setConfirmation(""); setMessage(""); }}>Start over</button>}
    </section>
  </div>;
}
