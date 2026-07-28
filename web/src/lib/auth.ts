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

// A store that never changes after mount, purely to get a `false` snapshot
// on the server/first-paint and `true` on the client — the standard
// no-effect way to know hydration has landed, timed to resolve at the same
// point React corrects `session` from its server snapshot.
function subscribeNever() {
  return () => {};
}
function isHydratedSnapshot() {
  return true;
}
function isHydratedServerSnapshot() {
  return false;
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
  const hydrated = useSyncExternalStore(subscribeNever, isHydratedSnapshot, isHydratedServerSnapshot);

  const logout = useCallback(async () => {
    const current = getSnapshot();
    writeSession(null);
    if (current) {
      // Best-effort — the local session is already cleared either way.
      await api.post("/auth/logout", undefined, current.token).catch(() => {});
    }
  }, []);

  return {
    ready: hydrated,
    user: session?.user ?? null,
    token: session?.token ?? null,
    isAuthenticated: session !== null,
    logout,
  };
}

export function storeSession(token: string, user: AuthUser) {
  writeSession({ token, user });
}

export function clearSession() {
  writeSession(null);
}

const ADMIN_HOSTNAME = process.env.NEXT_PUBLIC_ADMIN_HOSTNAME ?? "superadmin.mytuto.org";

/**
 * Admin/super_admin accounts are only usable from the dedicated admin
 * subdomain; every other role is only usable everywhere else. This is a
 * product/UX gate, not a security boundary — the API itself has no
 * awareness of which frontend hostname a login came from.
 */
export function isAllowedOnHost(role: AuthUser["role"], hostname: string): boolean {
  const isAdminHost = hostname === ADMIN_HOSTNAME;
  const isAdminRole = role === "admin" || role === "super_admin";
  return isAdminHost === isAdminRole;
}

export { ADMIN_HOSTNAME };
