"use client";

import { useEffect, useState } from "react";
import { buildAuthUrl, getSession, type AuthUser } from "@/lib/auth-client";
import "@muflah/account-switcher";

const keys = ["7", "8", "9", "÷", "4", "5", "6", "×", "1", "2", "3", "−", "0", ".", "C", "+"];

export default function CalculatorApp({ authUrl }: { authUrl: string }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [value, setValue] = useState("0");
  const [stored, setStored] = useState<number | null>(null);
  const [operator, setOperator] = useState<string | null>(null);
  const [fresh, setFresh] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    getSession().then((result) => { setUser(result?.user ?? null); }).catch(() => setError("We could not reach the auth service.")).finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    const onAccountChanged = (event: Event) => {
      const nextUser = (event as CustomEvent<{ user?: AuthUser }>).detail?.user;
      if (nextUser) setUser(nextUser);
    };
    const onSessionInvalidated = () => {
      setUser(null);
      window.location.assign(buildAuthUrl(authUrl));
    };
    window.addEventListener("muflah:active-account-changed", onAccountChanged);
    window.addEventListener("muflah:session-invalidated", onSessionInvalidated);
    return () => {
      window.removeEventListener("muflah:active-account-changed", onAccountChanged);
      window.removeEventListener("muflah:session-invalidated", onSessionInvalidated);
    };
  }, [authUrl]);

  function press(key: string) {
    setError("");
    if (key === "C") { setValue("0"); setStored(null); setOperator(null); setFresh(true); return; }
    if (["+", "−", "×", "÷"].includes(key)) { setStored(Number(value)); setOperator(key); setFresh(true); return; }
    if (key === "." && value.includes(".")) return;
    if (fresh) { setValue(key === "." ? "0." : key); setFresh(false); } else setValue(value === "0" && key !== "." ? key : value + key);
  }

  function calculate() {
    if (stored === null || !operator) return;
    const current = Number(value);
    const result = operator === "+" ? stored + current : operator === "−" ? stored - current : operator === "×" ? stored * current : current === 0 ? NaN : stored / current;
    if (!Number.isFinite(result)) { setValue("Error"); setError("Cannot divide by zero."); } else setValue(String(Number(result.toFixed(10))));
    setStored(null); setOperator(null); setFresh(true);
  }

  if (loading) return <main className="state"><span className="loader" />Checking your session…</main>;
  if (!user) return <main className="state"><section className="notice-card"><span className="eyebrow">Web app template</span><h1>Sign in to use the calculator.</h1><p>{error || "This product is protected by the central auth service."}</p><a className="button" href={buildAuthUrl(authUrl)} onClick={(event) => { event.preventDefault(); window.location.assign(buildAuthUrl(authUrl)); }}>Continue to auth ↗</a></section></main>;

  return <main className="app"><account-switcher auth-url={authUrl} /><section className="workspace"><div className="intro"><span className="eyebrow">Protected web app</span><h1>Quick math.</h1><p>A small product surface using the same auth redirect, session, and logout contract.</p></div><section className="calculator" aria-label="Calculator"><div className="display"><small>{stored !== null ? `${stored} ${operator ?? ""}` : "Ready"}</small><strong>{value}</strong></div><div className="keypad">{keys.map((key) => <button key={key} className={key === "C" ? "clear" : ["+", "−", "×", "÷"].includes(key) ? "operator" : ""} type="button" onClick={() => press(key)}>{key}</button>)}<button className="equals" type="button" onClick={calculate}>=</button></div>{error && <p className="error" role="alert">{error}</p>}</section></section></main>;
}
