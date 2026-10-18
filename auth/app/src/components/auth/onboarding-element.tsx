"use client";

import "@muflah/onboarding";
import { useEffect, useState } from "react";
import { getTrustedReturnTo } from "@/lib/return-url";

export default function OnboardingElement({ authUrl }: { authUrl: string }) {
  const [returnTo, setReturnTo] = useState("");

  useEffect(() => {
    setReturnTo(getTrustedReturnTo() ?? "");
  }, []);

  return <muflah-onboarding auth-url={authUrl} session-url="/api/auth/get-session" complete-url="/api/onboarding/complete" return-to={returnTo} />;
}
