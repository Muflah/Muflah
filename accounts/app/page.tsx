import AccountShell from "@/components/account-shell/account-shell";

export default function AccountPage() {
  return <AccountShell authUrl={process.env.AUTH_URL ?? "http://localhost:3000"} />;
}
