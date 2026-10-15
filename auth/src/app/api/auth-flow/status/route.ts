import { NextResponse } from "next/server";
import { auth, database } from "../../../../better-auth/auth";

export async function GET(request: Request) {
  const headers = request.headers;
  const session = await auth.api.getSession({ headers });
  if (!session) return NextResponse.json({ authenticated: false });

  const accounts = await auth.api.listUserAccounts({ headers });
  const profile = await database.query(
    `SELECT "name", "username", "dateOfBirth", "onboardingComplete" FROM "user" WHERE "id" = $1 LIMIT 1`,
    [session.user.id],
  );
  const currentProfile = profile.rows[0];
  const profileComplete = Boolean(
    currentProfile?.name &&
    currentProfile?.username &&
    currentProfile?.dateOfBirth,
  );
  return NextResponse.json({
    authenticated: true,
    hasCredential: accounts.some((account) => account.providerId === "credential"),
    onboardingComplete: currentProfile?.onboardingComplete === true && profileComplete,
  });
}
