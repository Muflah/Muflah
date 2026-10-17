"use client";

import { FormEvent, useEffect, useState } from "react";

type StoredAccount = { name: string; username: string; email: string; onboardingComplete: boolean; sessionToken?: string };
type AccountSwitcherProps = { name: string; username: string; email: string; onboardingComplete?: boolean; availableAccounts?: StoredAccount[] };

export default function AccountSwitcher({ name, username, email, onboardingComplete = true, availableAccounts = [] }: AccountSwitcherProps) {
  const [open, setOpen] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [step, setStep] = useState<"identifier" | "credentials" | "verify">("identifier");
  const [flow, setFlow] = useState<"sign-in" | "sign-up">("sign-in");
  const [verificationMode, setVerificationMode] = useState<"email-verification" | "sign-in">("email-verification");
  const [emailValue, setEmailValue] = useState("");
  const [nameValue, setNameValue] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [accounts, setAccounts] = useState<StoredAccount[]>([]);

  useEffect(() => {
    const current: StoredAccount = { name, username, email, onboardingComplete };
    const merged = [current, ...availableAccounts.filter((account) => account.email.toLowerCase() !== email.toLowerCase())];
    setAccounts(merged);
  }, [availableAccounts, email, name, onboardingComplete, username]);

  function rememberAccount(account: Partial<StoredAccount> & { email: string }) {
    const next: StoredAccount = { name: account.name ?? account.email, username: account.username ?? "", email: account.email, onboardingComplete: account.onboardingComplete ?? false };
    setAccounts((current) => {
      return [next, ...current.filter((item) => item.email.toLowerCase() !== next.email.toLowerCase())];
    });
  }

  async function selectAccount(account: StoredAccount) {
    if (account.email.toLowerCase() === email.toLowerCase() || !account.sessionToken) return;
    setOpen(false);
    const response = await fetch("/api/auth/multi-session/set-active", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ sessionToken: account.sessionToken }) });
    if (!response.ok) { setMessage("That account session is no longer available."); return; }
    window.location.assign(account.onboardingComplete && account.username ? `/${encodeURIComponent(account.username)}` : "/onboarding");
  }

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
      if (result.exists) {
        const otpResponse = await fetch("/api/auth/email-otp/send-verification-otp", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email: emailValue, type: "sign-in" }) });
        const otpResult = await otpResponse.json().catch(() => ({}));
        if (!otpResponse.ok) throw new Error(otpResult.message ?? "Unable to send a sign-in code");
        setFlow("sign-in");
        setVerificationMode("sign-in");
        setStep("verify");
        setMessage("We sent a sign-in code to your email.");
      } else {
        setFlow("sign-up");
        setVerificationMode("email-verification");
        setStep("credentials");
      }
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
      else { rememberAccount(result.user ?? { email: emailValue }); setMessage("Account authenticated. Refreshing your account list…"); setModalOpen(false); window.location.reload(); }
    } catch (error) { setMessage(error instanceof Error ? error.message : "Authentication failed"); }
    finally { setBusy(false); }
  }

  async function verifyEmail(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setMessage("");
    try {
      const endpoint = verificationMode === "sign-in" ? "/api/auth/sign-in/email-otp" : "/api/auth/email-otp/verify-email";
      const response = await fetch(endpoint, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email: emailValue, otp }) });
      const result = await response.json().catch(() => ({}));
      if (!response.ok || result.status === false) throw new Error(result.message ?? "That code is not valid");
      if (verificationMode === "sign-in") {
        rememberAccount(result.user ?? { email: emailValue });
        setMessage("Account authenticated. Refreshing your account list…");
        setModalOpen(false);
        window.location.reload();
      } else {
        rememberAccount({ name: nameValue, email: emailValue, onboardingComplete: false });
        setMessage("Email verified. Continue to onboarding.");
        setModalOpen(false);
        window.location.assign("/onboarding");
      }
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
            {accounts.map((account) => <button className="account-switcher-account" role="menuitem" key={account.email} aria-current={account.email.toLowerCase() === email.toLowerCase() ? "true" : undefined} onClick={() => selectAccount(account)}>
              <span className="profile-avatar profile-avatar-small" aria-hidden="true">{account.name.slice(0, 1).toUpperCase()}</span>
              <span><strong>{account.name}</strong><small>{account.username ? `@${account.username} · ` : ""}{account.email}</small></span>
              <span className="account-switcher-current">{account.email.toLowerCase() === email.toLowerCase() ? "Current" : account.onboardingComplete ? "Available" : "Finish setup"}</span>
            </button>)}
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
