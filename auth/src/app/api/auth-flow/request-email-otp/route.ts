import { NextResponse } from "next/server";
import { auth } from "../../../../better-auth/auth";

export async function POST(request: Request) {
  const body = (await request.json()) as { email?: string };
  const email = body.email?.trim().toLowerCase() ?? "";

  if (!email) {
    return NextResponse.json({ error: "Enter a valid email address." }, { status: 400 });
  }

  try {
    await auth.api.sendVerificationOTP({
      body: { email, type: "sign-in" },
    });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "We could not send the email. Please try again." }, { status: 400 });
  }
}
