import { NextResponse } from "next/server";
import { auth } from "../../../../better-auth/auth";

export async function GET(request: Request) {
  const headers = request.headers;
  const session = await auth.api.getSession({ headers });
  if (!session) return NextResponse.json({ authenticated: false });

  const accounts = await auth.api.listUserAccounts({ headers });
  return NextResponse.json({
    authenticated: true,
    hasCredential: accounts.some((account) => account.providerId === "credential"),
    onboardingComplete: session.user.onboardingComplete === true,
  });
}
