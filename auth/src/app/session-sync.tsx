"use client";

import { useEffect } from "react";

const SESSION_SWITCH_EVENT = "muflah-auth-session-switched";
const SESSION_SWITCH_STORAGE_KEY = "muflah-auth-session-switch";

export default function SessionSync() {
  useEffect(() => {
    let refreshWhenVisible = false;
    const refresh = () => {
      if (document.visibilityState === "visible") {
        window.location.reload();
      } else {
        refreshWhenVisible = true;
      }
    };
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible" && refreshWhenVisible) window.location.reload();
    };
    const handleStorage = (event: StorageEvent) => {
      if (event.key === SESSION_SWITCH_STORAGE_KEY) refresh();
    };

    window.addEventListener("storage", handleStorage);
    document.addEventListener("visibilitychange", handleVisibilityChange);
    const channel = "BroadcastChannel" in window ? new BroadcastChannel(SESSION_SWITCH_EVENT) : null;
    channel?.addEventListener("message", refresh);

    return () => {
      window.removeEventListener("storage", handleStorage);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      channel?.close();
    };
  }, []);

  return null;
}

export function announceSessionSwitch() {
  if (typeof window === "undefined") return;
  try {
    if ("BroadcastChannel" in window) {
      const channel = new BroadcastChannel(SESSION_SWITCH_EVENT);
      channel.postMessage({ switchedAt: Date.now() });
      channel.close();
    }
  } catch {
    // The active tab must still reload if cross-tab messaging is unavailable.
  }
  try {
    window.localStorage.setItem(SESSION_SWITCH_STORAGE_KEY, String(Date.now()));
  } catch {
    // Cross-tab refresh is best effort; it must not block account switching.
  }
}
