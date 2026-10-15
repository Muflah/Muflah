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

    return response;
  } catch {
    return NextResponse.json({ error: "The verification code is invalid or expired." }, { status: 400 });
  }
}
