import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Account settings | Muflah",
  description: "Manage your Muflah account.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
