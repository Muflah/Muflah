import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { sendTransactionalEmail } from "@/lib/email/connector";
import { isValidUsername, usernameValues } from "@/lib/username";
import { recordUsernameAlias } from "@/lib/username-history";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session) return NextResponse.json({ error: "Authentication required" }, { status: 401 });

  const body = (await request.json().catch(() => null)) as { username?: unknown } | null;
  const values = typeof body?.username === "string" ? usernameValues(body.username) : { username: "", displayUsername: "" };
  const { username, displayUsername } = values;
  if (!isValidUsername(displayUsername)) {
    return NextResponse.json({ error: "Choose a valid username." }, { status: 400 });
  }

  const context = await auth.$context;
  const currentUser = await context.internalAdapter.findUserById(session.user.id);
  if (!currentUser) return NextResponse.json({ error: "Account not found" }, { status: 404 });

  const current = currentUser as typeof currentUser & { onboardingStatus?: string; username?: string | null; displayUsername?: string | null };
  const alreadyComplete = current.onboardingStatus === "complete";
  if (alreadyComplete && current.username === username && current.displayUsername === displayUsername) return NextResponse.json({ username, displayUsername, onboardingComplete: true });

  try {
    if (current.username && current.username !== username) await recordUsernameAlias(session.user.id, current.username, current.displayUsername || current.username);
    await auth.api.updateUser({
      headers: request.headers,
      body: { username, displayUsername },
    });
  } catch {
    return NextResponse.json({ error: "That username is already taken or unavailable." }, { status: 409 });
  }

  const completedAt = new Date();
  const completedUser = await context.internalAdapter.updateUser(session.user.id, {
    onboardingStatus: "complete",
    onboardingCompletedAt: completedAt,
  });

  if (!alreadyComplete) {
    await sendTransactionalEmail({
      to: completedUser.email,
      type: "welcome",
      subject: "Welcome to Muflah",
      html: `<p>Welcome to Muflah, ${completedUser.name}.</p><p>Your account is ready to use.</p>`,
    });
  }

  return NextResponse.json({
    user: completedUser,
    username,
    displayUsername,
    onboardingComplete: true,
  });
}
