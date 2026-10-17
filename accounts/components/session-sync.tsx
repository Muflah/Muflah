"use client";
import { useEffect } from "react";
export type SessionEventType = "account-switched" | "account-logged-out" | "session-revoked";
const CHANNEL_NAME = "muflah-auth-session";
const STORAGE_KEY = "muflah-auth-session-event";
export function publishSessionEvent(type: SessionEventType) {
  const event = { id: crypto.randomUUID(), type, at: Date.now() };
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(event));
  if (typeof BroadcastChannel !== "undefined") { const channel = new BroadcastChannel(CHANNEL_NAME); channel.postMessage(event); channel.close(); }
}
export default function SessionSync() {
  useEffect(() => {
    let stale = false;
    const seen = new Set<string>();
    const handleEvent = (event: { id?: string }) => { if (!event.id || seen.has(event.id)) return; seen.add(event.id); if (document.visibilityState === "visible") window.location.reload(); else stale = true; };
    const channel = typeof BroadcastChannel !== "undefined" ? new BroadcastChannel(CHANNEL_NAME) : null;
    const onBroadcast = (event: MessageEvent<{ id?: string }>) => handleEvent(event.data);
    const onStorage = (event: StorageEvent) => { if (event.key !== STORAGE_KEY || !event.newValue) return; try { handleEvent(JSON.parse(event.newValue) as { id?: string }); } catch { /* Ignore malformed events. */ } };
    const onVisibilityChange = () => { if (document.visibilityState === "visible" && stale) window.location.reload(); };
    channel?.addEventListener("message", onBroadcast); window.addEventListener("storage", onStorage); document.addEventListener("visibilitychange", onVisibilityChange);
    return () => { channel?.removeEventListener("message", onBroadcast); channel?.close(); window.removeEventListener("storage", onStorage); document.removeEventListener("visibilitychange", onVisibilityChange); };
  }, []);
  return null;
}
