"use client";

import { useCallback, useSyncExternalStore } from "react";
import { api } from "./api";

export type AuthUser = {
  id: number;
  name: string;
  email: string;
  role: "student" | "parent" | "teacher" | "admin" | "super_admin";
};

type StoredSession = { token: string; user: AuthUser };

const STORAGE_KEY = "mytuto.auth";

// Cached so useSyncExternalStore's getSnapshot returns a stable reference
// when nothing has changed — re-parsing localStorage on every call would
// otherwise look like a change on every render and loop.
let cached: StoredSession | null | undefined;

function readSession(): StoredSession | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as StoredSession) : null;
  } catch {
    return null;
  }
}

function getSnapshot(): StoredSession | null {
  if (cached === undefined) cached = readSession();
  return cached;
}

function getServerSnapshot(): StoredSession | null {
  return null;
}

function subscribe(onStoreChange: () => void) {
  const handler = () => {
    cached = readSession();
    onStoreChange();
  };
  window.addEventListener("mytuto-auth-change", handler);
  window.addEventListener("storage", handler);
  return () => {
    window.removeEventListener("mytuto-auth-change", handler);
    window.removeEventListener("storage", handler);
  };
}

function writeSession(session: StoredSession | null) {
  if (typeof window === "undefined") return;
  if (session) {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
  } else {
    window.localStorage.removeItem(STORAGE_KEY);
  }
  cached = session;
  // Same-tab listeners (e.g. the header) don't get a native `storage`
  // event since that only fires in *other* tabs — dispatch our own.
  window.dispatchEvent(new Event("mytuto-auth-change"));
}

/** Client-side auth state, backed by localStorage. */
export function useAuth() {
  const session = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const logout = useCallback(async () => {
    const current = getSnapshot();
    writeSession(null);
    if (current) {
      // Best-effort — the local session is already cleared either way.
      await api.post("/auth/logout", undefined, current.token).catch(() => {});
    }
  }, []);

  return {
    // True once we're past the server-rendered (always-null) snapshot —
    // callers use this to avoid flashing logged-out UI during hydration.
    ready: typeof window !== "undefined",
    user: session?.user ?? null,
    token: session?.token ?? null,
    isAuthenticated: session !== null,
    logout,
  };
}

export function storeSession(token: string, user: AuthUser) {
  writeSession({ token, user });
}
