"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import "@muflah/account-switcher";
import { buildAuthUrl, getSession, type AuthUser } from "@/lib/auth-client";

const navigation = [
  { label: "Overview", href: "/" },
  { label: "Profile", href: "/profile" },
  { label: "Security", href: "/security" },
  { label: "Sessions", href: "/security/sessions" },
  { label: "Settings", href: "/settings" },
];

export default function AccountShell({ authUrl, activePage = "Overview", children }: { authUrl: string; activePage?: string; children?: React.ReactNode }) {
  const router = useRouter();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    getSession()
      .then((session) => {
        if (!active) return;
        const nextUser = session?.user ?? null;
        setUser(nextUser);
      })
      .catch(() => { if (active) setError("We could not reach the auth service."); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    const onAccountChanged = (event: Event) => {
      const nextUser = (event as CustomEvent<{ user?: AuthUser }>).detail?.user;
      if (nextUser) {
        setUser(nextUser);
        router.refresh();
      }
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
  }, [authUrl, router]);

  const firstName = useMemo(() => user?.name?.split(" ")[0] || "there", [user?.name]);

  if (loading) return <main className="loading-screen"><span className="loader" />Loading your account…</main>;

  if (!user || error) {
    return (
      <main className="empty-screen">
        <div className="empty-card">
          <span className="eyebrow">Muflah accounts</span>
          <h1>Sign in to manage your account.</h1>
          <p>{error || "Your account session is not active on this device."}</p>
          <a className="button button-primary" href={buildAuthUrl(authUrl)} onClick={(event) => { event.preventDefault(); window.location.assign(buildAuthUrl(authUrl)); }}>Continue to sign in ↗</a>
        </div>
      </main>
    );
  }

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <Link className="brand" href="/" aria-label="Muflah home">m</Link>
        <div className="sidebar-caption">Account center</div>
        <nav aria-label="Account navigation">
          {navigation.map((item) => <Link className={item.label === activePage ? "nav-link active" : "nav-link"} href={item.href} key={item.href}>{item.label}</Link>)}
        </nav>
        <div className="sidebar-footer"><span className="status-dot" />Auth service connected</div>
      </aside>
      <main className="main-content">
        <header className="topbar"><span className="breadcrumb">Account center / {activePage}</span><account-switcher auth-url={authUrl} /></header>
        <section className="content-wrap">
          <div className="intro"><div><span className="eyebrow">{activePage}</span><h1>{activePage === "Overview" ? `Good to see you, ${firstName}.` : activePage}</h1><p>{activePage === "Overview" ? "Manage your identity, sessions, and account preferences from one place." : "This pilot surface is connected to the authoritative auth service."}</p></div><span className="intro-mark">✦</span></div>
          {children ?? <div className="card-grid">
            <article className="feature-card"><span className="card-number">01</span><h2>{activePage === "Overview" ? "Your account" : activePage}</h2><p>{user.name || "Account holder"}<br />{user.email}</p><Link href="/profile" className="text-link">View profile ↗</Link></article>
            <article className="feature-card dark"><span className="card-number">02</span><h2>Security</h2><p>Review active sessions and keep your account secure.</p><Link href="/security" className="text-link">Manage sessions ↗</Link></article>
            <article className="feature-card accent"><span className="card-number">03</span><h2>Preferences</h2><p>More account settings will be added to this pilot shell.</p><Link href="/settings" className="text-link">Open settings ↗</Link></article>
          </div>}
          <div className="authority-note"><span>●</span><p><strong>Auth-owned session</strong> Account identity and session state are managed by the central auth service.</p></div>
        </section>
      </main>
    </div>
  );
}
