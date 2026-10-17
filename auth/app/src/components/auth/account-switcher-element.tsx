"use client";

import "@muflah/account-switcher";

export default function AccountSwitcherElement({ authUrl }: { authUrl: string }) {
  return <account-switcher auth-url={authUrl} />;
}
