import CalculatorApp from "@/components/calculator-app";

export default function Page() {
  const authUrl = process.env.AUTH_URL;
  if (!authUrl) throw new Error("AUTH_URL must be configured for the web app");
  return <CalculatorApp authUrl={authUrl} />;
}
