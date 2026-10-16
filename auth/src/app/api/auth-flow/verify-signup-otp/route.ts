import { NextResponse } from "next/server";
import { auth, database } from "../../../../better-auth/auth";

export async function POST(request: Request) {
  const body = (await request.json()) as { email?: string; otp?: string };
  const email = body.email?.trim().toLowerCase() ?? "";
  const otp = body.otp?.trim() ?? "";

  if (!email || !otp) {
    return NextResponse.json({ error: "The verification code is invalid or expired." }, { status: 400 });
  }

  const userTable = '"user"';
  const userIdColumn = '"id"';
  const emailColumn = '"email"';
  const verifiedColumn = '"emailVerified"';
  const existing = await database.query(
    `SELECT ${userIdColumn} AS id, ${verifiedColumn} AS email_verified FROM ${userTable} WHERE LOWER(${emailColumn}) = LOWER($1) LIMIT 1`,
    [email],
  );
  let hasCredential = false;
  if (existing.rowCount) {
    const credential = await database.query(
      `SELECT EXISTS(SELECT 1 FROM "account" WHERE "userId" = $1 AND "providerId" = 'credential') AS has_credential`,
      [existing.rows[0].id],
    );
    hasCredential = credential.rows[0]?.has_credential === true;
  }

  try {
    const response = await auth.api.signInEmailOTP({
      body: {
        email,
        otp,
        name: email.split("@")[0],
        onboardingComplete: false,
      },
      asResponse: true,
    });

    if (existing.rowCount) {
      await database.query(
        `UPDATE ${userTable} SET ${verifiedColumn} = true WHERE ${userIdColumn} = $1`,
        [existing.rows[0].id],
      );
    }

    response.headers.set("X-Auth-Has-Credential", String(hasCredential));
    return response;
  } catch {
    return NextResponse.json({ error: "The verification code is invalid or expired." }, { status: 400 });
  }
}
