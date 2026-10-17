"use client";

import { FormEvent, useState } from "react";

type AccountSwitcherProps = { name: string; username: string; email: string };

export default function AccountSwitcher({ name, username, email }: AccountSwitcherProps) {
  const [open, setOpen] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [step, setStep] = useState<"identifier" | "credentials" | "verify">("identifier");
  const [flow, setFlow] = useState<"sign-in" | "sign-up">("sign-in");
  const [emailValue, setEmailValue] = useState("");
  const [nameValue, setNameValue] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  function openModal() {
    setOpen(false);
    setModalOpen(true);
    setStep("identifier");
    setMessage("");
  }

  async function lookup(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setMessage("");
    try {
      const response = await fetch("/api/identity/lookup", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email: emailValue }) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error ?? "Unable to continue");
      setFlow(result.exists ? "sign-in" : "sign-up");
      setStep("credentials");
    } catch (error) { setMessage(error instanceof Error ? error.message : "Unable to continue"); }
    finally { setBusy(false); }
  }

  async function submitCredentials(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setMessage("");
    try {
      const endpoint = flow === "sign-in" ? "/api/auth/sign-in/email" : "/api/auth/sign-up/email";
      const body = flow === "sign-in" ? { email: emailValue, password } : { email: emailValue, password, name: nameValue };
      const response = await fetch(endpoint, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result.message ?? "Authentication failed");
      if (flow === "sign-up") { setStep("verify"); setMessage("We sent a verification code to your email."); }
      else { setMessage("Account authenticated. Refreshing your account list…"); setModalOpen(false); window.location.reload(); }
    } catch (error) { setMessage(error instanceof Error ? error.message : "Authentication failed"); }
    finally { setBusy(false); }
  }

  async function verifyEmail(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setMessage("");
    try {
      const response = await fetch("/api/auth/email-otp/verify-email", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email: emailValue, otp }) });
      const result = await response.json().catch(() => ({}));
      if (!response.ok || result.status === false) throw new Error(result.message ?? "That code is not valid");
      setStep("credentials");
      setFlow("sign-in");
      setOtp("");
      setMessage("Email verified. Sign in with your password to continue.");
    } catch (error) { setMessage(error instanceof Error ? error.message : "That code is not valid"); }
    finally { setBusy(false); }
  }

  return (
    <>
      <div className="account-switcher">
        <button className="account-switcher-trigger" type="button" aria-expanded={open} onClick={() => setOpen((value) => !value)}>
          <span className="profile-avatar" aria-hidden="true">{name.slice(0, 1).toUpperCase()}</span>
          <span className="account-switcher-summary"><strong>{name}</strong><small>@{username}</small></span>
          <span className="account-switcher-chevron" aria-hidden="true">⌄</span>
        </button>
        {open && (
          <div className="account-switcher-menu" role="menu">
            <p className="account-switcher-heading">Available accounts</p>
            <div className="account-switcher-account" role="menuitem" aria-current="true">
              <span className="profile-avatar profile-avatar-small" aria-hidden="true">{name.slice(0, 1).toUpperCase()}</span>
              <span><strong>{name}</strong><small>@{username} · {email}</small></span>
              <span className="account-switcher-current">Current</span>
            </div>
            <button className="account-switcher-add" type="button" onClick={openModal}>＋ Add account</button>
          </div>
        )}
      </div>
      {modalOpen && (
        <div className="account-modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.currentTarget === event.target) setModalOpen(false); }}>
          <section className="account-modal" role="dialog" aria-modal="true" aria-labelledby="account-modal-title">
            <button className="account-modal-close" type="button" aria-label="Close account dialog" onClick={() => setModalOpen(false)}>×</button>
            <p className="micro">Account switcher</p>
            <h2 id="account-modal-title">Add an account.</h2>
            <p>{step === "verify" ? `Enter the code sent to ${emailValue}.` : step === "identifier" ? "Sign in to another account or create a new one." : `Continue with ${emailValue}.`}</p>
            {step === "identifier" && <form className="auth-form" onSubmit={lookup}><label htmlFor="add-account-email">Email address</label><input id="add-account-email" type="email" autoComplete="email" required value={emailValue} onChange={(event) => setEmailValue(event.target.value)} /><div className="auth-actions"><button className="auth-button" disabled={busy}>{busy ? "Checking…" : "Continue ↗"}</button></div></form>}
            {step === "credentials" && <form className="auth-form" onSubmit={submitCredentials}>{flow === "sign-up" && <><label htmlFor="add-account-name">Name</label><input id="add-account-name" autoComplete="name" required value={nameValue} onChange={(event) => setNameValue(event.target.value)} /></>}<label htmlFor="add-account-password">Password</label><input id="add-account-password" type="password" autoComplete={flow === "sign-in" ? "current-password" : "new-password"} required value={password} onChange={(event) => setPassword(event.target.value)} /><div className="auth-actions"><button className="auth-button" disabled={busy}>{busy ? "Working…" : flow === "sign-in" ? "Log in ↗" : "Create account ↗"}</button></div></form>}
            {step === "verify" && <form className="auth-form" onSubmit={verifyEmail}><label htmlFor="add-account-otp">Verification code</label><input id="add-account-otp" inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]{6}" maxLength={6} required value={otp} onChange={(event) => setOtp(event.target.value.replace(/\D/g, ""))} /><div className="auth-actions"><button className="auth-button" disabled={busy}>{busy ? "Verifying…" : "Verify email ↗"}</button></div></form>}
            {message && <p className="notice">{message}</p>}
          </section>
        </div>
      )}
    </>
  );
}
