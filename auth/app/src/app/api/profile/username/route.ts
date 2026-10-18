import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { isValidUsername, usernameValues } from "@/lib/username";
import { recordUsernameAlias } from "@/lib/username-history";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session) return NextResponse.json({ error: "Authentication required" }, { status: 401 });

  const body = (await request.json().catch(() => null)) as { username?: unknown } | null;
  const values = typeof body?.username === "string" ? usernameValues(body.username) : { username: "", displayUsername: "" };
  if (!isValidUsername(values.displayUsername)) return NextResponse.json({ error: "Choose a valid username." }, { status: 400 });

  try {
    if (session.user.username && session.user.username !== values.username) {
      await recordUsernameAlias(session.user.id, session.user.username, session.user.displayUsername || session.user.username);
    }
    await auth.api.updateUser({ headers: request.headers, body: values });
    return NextResponse.json(values);
  } catch {
    return NextResponse.json({ error: "That username is already taken or unavailable." }, { status: 409 });
  }
}
