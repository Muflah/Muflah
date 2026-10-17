import AccountShell from "@/components/account-shell/account-shell";

export default function SettingsPage() {
  const authUrl = process.env.AUTH_URL;
  if (!authUrl) throw new Error("AUTH_URL must be configured for the accounts app");
  return <AccountShell authUrl={authUrl} activePage="Settings" />;
}
