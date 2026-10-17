"use client";
import { useState } from "react";
import { publishSessionEvent } from "@muflah/account-switcher";
import { revokeSession, type AuthSession } from "@/lib/auth-client";
type SessionItem = AuthSession & { ipAddress?: string | null; userAgent?: string | null; updatedAt?: string };
function formatDate(value?: string) { return value ? new Date(value).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" }) : "Unknown"; }
export default function SessionList({ sessions, currentToken }: { sessions: SessionItem[]; currentToken?: string }) {
  const [items, setItems] = useState(sessions); const [busy, setBusy] = useState<string | null>(null);
  async function revoke(token: string) { setBusy(token); try { await revokeSession(token); setItems((current) => current.filter((session) => session.token !== token)); publishSessionEvent("session-revoked"); } finally { setBusy(null); } }
  return <div className="session-list">{items.map((session, index) => <article className="session-item" key={session.id ?? session.token ?? index}><div><strong>{session.userAgent || "Unknown device"}</strong><span>{session.ipAddress || "IP unavailable"}</span><small>Last active {formatDate(session.updatedAt)}</small><small>Session expires {formatDate(session.expiresAt)}</small></div>{session.token && <button className="session-revoke" type="button" onClick={() => revoke(session.token!)} disabled={busy === session.token}>{busy === session.token ? "Revoking…" : session.token === currentToken ? "Revoke this session" : "Revoke"}</button>}</article>)}{items.length === 0 && <p className="account-lede">No active sessions remain.</p>}</div>;
}
