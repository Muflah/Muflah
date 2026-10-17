import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import AccountActions from "@/components/auth/account-actions";
import SessionList from "@/components/auth/session-list";

export default async function SessionsPage() {
  const requestHeaders = await headers();
  const current = await auth.api.getSession({ headers: requestHeaders });
  if (!current) redirect("/");
  if (current.user.onboardingStatus !== "complete" || !current.user.username) redirect("/onboarding");

  const sessions = await auth.api.listDeviceSessions({ headers: requestHeaders });
  return (
    <div className="account-shell">
      <aside className="account-sidebar">
        <a className="brand" href="https://muflah.com/" aria-label="Muflah home">m</a>
        <div className="account-profile">
          <span className="profile-avatar" aria-hidden="true">{current.user.name.slice(0, 1).toUpperCase()}</span>
          <div><strong>{current.user.name}</strong><span>@{current.user.username}</span><small>{current.user.email}</small></div>
        </div>
        <nav className="account-nav" aria-label="Account navigation">
          <a href={`/${encodeURIComponent(current.user.username)}`}>Account home</a>
          <a href="/security/sessions" aria-current="page">Sessions &amp; security</a>
        </nav>
        <AccountActions />
      </aside>
      <main className="account-content">
        <p className="micro">Security</p>
        <h1>Active sessions.</h1>
        <p className="account-lede">Review where your account is signed in and revoke access you no longer recognize.</p>
        <SessionList sessions={sessions.map((item) => ({ ...item.session, updatedAt: item.session.updatedAt.toISOString() }))} currentToken={current.session.token} />
      </main>
    </div>
  );
}
