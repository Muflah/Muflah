"use client";

import { FormEvent, useEffect, useState } from "react";

type Flow = "sign-in" | "sign-up";
type Step = "identifier" | "credentials" | "verify";

export default function HomePage() {
  const [email, setEmail] = useState("");
  const [flow, setFlow] = useState<Flow | null>(null);
  const [step, setStep] = useState<Step>("identifier");
  const [password, setPassword] = useState("");
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [name, setName] = useState("");
  const [otp, setOtp] = useState("");
  const [verificationMode, setVerificationMode] = useState<"email-verification" | "sign-in">("email-verification");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);
  const [sessionCheckError, setSessionCheckError] = useState("");
  const [sessionCheckAttempt, setSessionCheckAttempt] = useState(0);

  useEffect(() => {
    let active = true;
    const intent = new URLSearchParams(window.location.search).get("intent");
    if (intent === "login" || intent === "signup") {
      setCheckingSession(false);
      return () => { active = false; };
    }
    async function resolveSession() {
      try {
        const response = await fetch("/api/auth/get-session", { credentials: "include", cache: "no-store" });
        if (!response.ok) throw new Error("Session check failed");
        const result = await response.json();
        const user = result?.user;
        if (user) {
          window.location.replace(user.onboardingStatus === "complete" && user.username ? `/${encodeURIComponent(user.username)}` : "/onboarding");
          return;
        }

        const sessionsResponse = await fetch("/api/auth/multi-session/list-device-sessions", { credentials: "include", cache: "no-store" });
        if (!sessionsResponse.ok) throw new Error("Session list check failed");
        const sessions = await sessionsResponse.json();
        const nextSession = Array.isArray(sessions) ? sessions[0] : null;
        if (nextSession?.session?.token) {
          const activateResponse = await fetch("/api/auth/multi-session/set-active", { method: "POST", credentials: "include", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ sessionToken: nextSession.session.token }) });
          if (!activateResponse.ok) throw new Error("Unable to activate session");
          const nextUser = nextSession.user;
          window.location.replace(nextUser?.onboardingStatus === "complete" && nextUser.username ? `/${encodeURIComponent(nextUser.username)}` : "/onboarding");
          return;
        }
        if (active) setCheckingSession(false);
      } catch {
        if (active) {
          setSessionCheckError("We couldn’t verify your session.");
          setCheckingSession(false);
        }
      }
    }
    resolveSession();
    return () => { active = false; };
  }, [sessionCheckAttempt]);

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
      if (result.exists) {
        const otpResponse = await fetch("/api/auth/email-otp/send-verification-otp", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email, type: "sign-in" }) });
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
    const body = flow === "sign-in" ? { email, password } : { email, password, name };
    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) {
        const errorMessage = result.message ?? "Authentication failed";
        if (flow === "sign-in" && /verify|verification|verified/i.test(errorMessage)) {
          setStep("verify");
        }
        throw new Error(errorMessage);
      }
      if (flow === "sign-up") {
        setStep("verify");
        setMessage("We sent a verification code to your email.");
      } else {
        const destination = result.user?.onboardingStatus === "complete" && result.user?.username
          ? `/${encodeURIComponent(result.user.username)}`
          : "/onboarding";
        window.location.assign(destination);
      }
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Authentication failed");
    } finally {
      setBusy(false);
    }
  }

  async function verifyEmail(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setMessage("");
    try {
      const endpoint = verificationMode === "sign-in" ? "/api/auth/sign-in/email-otp" : "/api/auth/email-otp/verify-email";
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp }),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok || result.status === false) throw new Error(result.message ?? "That code is not valid");
      if (verificationMode === "sign-in") {
        const destination = result.user?.onboardingStatus === "complete" && result.user?.username ? `/${encodeURIComponent(result.user.username)}` : "/onboarding";
        window.location.assign(destination);
      } else {
        setOtp("");
        setMessage("Email verified. Continue to onboarding.");
        window.location.assign("/onboarding");
      }
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "That code is not valid");
    } finally {
      setBusy(false);
    }
  }

  async function resendCode() {
    setBusy(true);
    setMessage("");
    try {
      const response = await fetch("/api/auth/email-otp/send-verification-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, type: verificationMode }),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result.message ?? "Unable to send a new code");
      setMessage("A new verification code is on its way.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to send a new code");
    } finally {
      setBusy(false);
    }
  }

  const isError = /failed|unable|not valid|error/i.test(message);
  const title = step === "verify" ? "Check your email." : flow ? (flow === "sign-in" ? "Welcome back." : "Create your account.") : "Continue to your account.";
  const intro = step === "verify" ? `Enter the code we sent to ${email}.` : flow ? `Continue with ${email}.` : "Enter your email and we’ll take you to the right place.";

  if (checkingSession) {
    return <div className="auth-shell"><main className="auth-main"><p className="micro">Checking your session…</p></main></div>;
  }

  if (sessionCheckError) {
    return <div className="auth-shell"><main className="auth-main"><section className="auth-card"><p className="micro">Session check</p><h1>Let’s try that again.</h1><p className="intro">{sessionCheckError} Your account has not been signed out.</p><div className="auth-actions"><button className="auth-button" type="button" onClick={() => { setSessionCheckError(""); setCheckingSession(true); setSessionCheckAttempt((attempt) => attempt + 1); }}>Retry ↗</button></div></section></main></div>;
  }

  return (
    <div className="auth-shell">
      <header className="auth-header">
        <a className="brand" href="https://muflah.com/" aria-label="Muflah home">m</a>
        <span className="auth-label">Secure account access</span>
      </header>
      <main className="auth-main">
        <section className="auth-card" aria-live="polite">
          <p className="micro">Muflah account</p>
          <h1>{title}</h1>
          <p className="intro">{intro}</p>
          {step === "identifier" ? (
            <form className="auth-form" onSubmit={continueWithEmail}>
              <label htmlFor="email">Email address</label>
              <input id="email" type="email" autoComplete="email" required value={email} onChange={(event) => setEmail(event.target.value)} />
              <div className="auth-actions"><button className="auth-button" disabled={busy}>{busy ? "Checking…" : "Continue ↗"}</button></div>
            </form>
          ) : step === "verify" ? (
            <form className="auth-form" onSubmit={verifyEmail}>
              <label htmlFor="otp">Verification code</label>
              <input id="otp" inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]{6}" maxLength={6} required value={otp} onChange={(event) => setOtp(event.target.value.replace(/\D/g, ""))} />
              <div className="auth-actions">
                <button className="auth-button" disabled={busy}>{busy ? "Verifying…" : "Verify email ↗"}</button>
                <button className="auth-button secondary" type="button" disabled={busy} onClick={resendCode}>Resend code</button>
                <button className="auth-button secondary" type="button" disabled={busy} onClick={() => { setStep("identifier"); setFlow(null); setMessage(""); }}>Use a different email</button>
              </div>
            </form>
          ) : (
            <form className="auth-form" onSubmit={submitCredentials}>
              {flow === "sign-up" && <>
                <label htmlFor="name">Name</label>
                <input id="name" autoComplete="name" required value={name} onChange={(event) => setName(event.target.value)} />
              </>}
              <label htmlFor="password">Password</label>
              <div className="password-field">
                <input id="password" type={passwordVisible ? "text" : "password"} autoComplete={flow === "sign-in" ? "current-password" : "new-password"} required value={password} onChange={(event) => setPassword(event.target.value)} />
                <button className="password-toggle" type="button" aria-label={passwordVisible ? "Hide password" : "Show password"} aria-pressed={passwordVisible} onClick={() => setPasswordVisible((visible) => !visible)}>
                  {passwordVisible ? (
                    <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 3l18 18M10.6 10.6a2 2 0 0 0 2.8 2.8M9.9 5.2A10.8 10.8 0 0 1 12 5c5.2 0 9 5.5 9 7s-1.1 3-3.2 4.8M6.1 6.1C3.5 7.8 2 10.7 2 12c0 1.5 3.8 7 10 7 1.2 0 2.3-.2 3.3-.6" /></svg>
                  ) : (
                    <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M2 12s3.8-7 10-7 10 7 10 7-3.8 7-10 7S2 12 2 12Z" /><circle cx="12" cy="12" r="2.5" /></svg>
                  )}
                </button>
              </div>
              <div className="auth-actions">
                <button className="auth-button" disabled={busy}>{busy ? "Working…" : flow === "sign-in" ? "Sign in ↗" : "Create account ↗"}</button>
                <button className="auth-button secondary" type="button" disabled={busy} onClick={() => { setStep("identifier"); setFlow(null); setMessage(""); }}>Use a different email</button>
              </div>
            </form>
          )}
          {message && <p className={`notice${isError ? " error" : ""}`}>{message}</p>}
        </section>
      </main>
      <footer className="auth-footer"><p>© 2026 Muflah Ul Furqan.</p><p>Authentication service</p></footer>
    </div>
  );
}
