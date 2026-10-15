import { NextResponse } from "next/server";
import { auth } from "../../../../better-auth/auth";

const usernamePattern = /^[a-z0-9](?:[a-z0-9._]{1,28}[a-z0-9])?$/;
const reservedUsernames = new Set(["admin", "api", "auth", "help", "muflah", "root", "support"]);

export async function POST(request: Request) {
  const body = (await request.json()) as {
    name?: string;
    username?: string;
    dateOfBirth?: string;
  };
  const name = body.name?.trim() ?? "";
  const username = body.username?.trim().toLowerCase() ?? "";
  const dateOfBirth = body.dateOfBirth?.trim() ?? "";

  if (!name) return NextResponse.json({ error: "Name is required." }, { status: 400 });
  if (!usernamePattern.test(username) || reservedUsernames.has(username)) {
    return NextResponse.json({ error: "Choose a valid username." }, { status: 400 });
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateOfBirth)) {
    return NextResponse.json({ error: "Enter your date of birth." }, { status: 400 });
  }

  const headers = request.headers;
  const session = await auth.api.getSession({ headers });
  if (!session) return NextResponse.json({ error: "Your session has expired." }, { status: 401 });

  try {
    await auth.api.updateUser({
      body: { name, username, dateOfBirth, onboardingComplete: true },
      headers,
    });
  } catch {
    return NextResponse.json({ error: "That username is already in use." }, { status: 409 });
  }

  return NextResponse.json({ ok: true });
}
