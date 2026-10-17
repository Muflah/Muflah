import SessionsPage from "@/components/sessions-page";

export default function Page() {
  return <SessionsPage authUrl={process.env.AUTH_URL ?? "http://localhost:3000"} />;
}
