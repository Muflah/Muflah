"use client";

import { useEffect, useState } from "react";
import AccountShell from "@/components/account-shell/account-shell";
import SessionList from "@/components/session-list";
import { getSession, listDeviceSessions, type AuthSession } from "@/lib/auth-client";

export default function SessionsPage({ authUrl }: { authUrl: string }) {
  const [sessions, setSessions] = useState<AuthSession[]>([]);
  const [currentToken, setCurrentToken] = useState<string>();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([getSession(), listDeviceSessions()])
      .then(([current, deviceSessions]) => {
        setCurrentToken(current?.session?.token);
        const raw = Array.isArray(deviceSessions) ? deviceSessions : [];
        setSessions(raw.flatMap((item) => {
          if (!item || typeof item !== "object") return [];
          const entry = item as Record<string, unknown>;
          const session = entry.session && typeof entry.session === "object" ? entry.session as AuthSession : entry as AuthSession;
          return session.token ? [session] : [];
        }));
      })
      .finally(() => setLoading(false));
  }, []);

  return <AccountShell authUrl={authUrl} activePage="Sessions">
    <div className="intro"><span className="eyebrow">Security</span><h1>Active sessions.</h1><p>Review where your account is signed in and revoke access you no longer recognize.</p></div>
    {loading ? <p className="account-lede">Loading active sessions…</p> : <SessionList sessions={sessions} currentToken={currentToken} />}
  </AccountShell>;
}
