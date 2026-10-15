import { NextResponse } from "next/server";
import { auth } from "../../../../better-auth/auth";
import { isStrongPassword, passwordRequirements } from "../../../../config/password";

export async function POST(request: Request) {
  const body = (await request.json()) as { name?: string; password?: string };
  const name = body.name?.trim() ?? "";
  const password = body.password ?? "";

  if (!isStrongPassword(password)) {
    return NextResponse.json({ error: passwordRequirements }, { status: 400 });
  }
  if (!name) {
    return NextResponse.json({ error: "Name is required." }, { status: 400 });
  }

  const headers = request.headers;
  const session = await auth.api.getSession({ headers });
  if (!session) {
    return NextResponse.json({ error: "Your verification session has expired." }, { status: 401 });
  }

  const accounts = await auth.api.listUserAccounts({ headers });
  if (accounts.some((account) => account.providerId === "credential")) {
    await auth.api.signOut({ headers });
    return NextResponse.json({ error: "This account already exists. Please sign in instead." }, { status: 409 });
  }

  await auth.api.updateUser({
    body: { name },
    headers,
  });

  await auth.api.setPassword({
    body: { newPassword: password },
    headers,
  });

  await auth.api.enableTwoFactor({
    body: { method: "otp", password },
    headers,
  });

  return NextResponse.json({ ok: true });
}
