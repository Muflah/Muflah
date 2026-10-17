import SessionsPage from "@/components/sessions-page";

export default function Page() {
  const authUrl = process.env.AUTH_URL;
  if (!authUrl) throw new Error("AUTH_URL must be configured for the accounts app");
  return <SessionsPage authUrl={authUrl} />;
}
