import AccountShell from "@/components/account-shell/account-shell";

export default function SecurityPage() {
  return <AccountShell authUrl={process.env.AUTH_URL ?? "http://localhost:3000"} activePage="Security" />;
}
