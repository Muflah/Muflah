import { NextResponse } from "next/server";
import { auth } from "../../../../better-auth/auth";

export async function POST(request: Request) {
  const body = (await request.json()) as { password?: string };
  const password = body.password ?? "";

  if (!password) return NextResponse.json({ error: "We could not sign you in with those details." }, { status: 400 });

  try {
    await auth.api.verifyPassword({
      body: { password },
      headers: request.headers,
    });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "We could not sign you in with those details." }, { status: 401 });
  }
}
