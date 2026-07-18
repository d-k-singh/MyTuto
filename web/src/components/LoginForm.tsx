"use client";

import { useState } from "react";
import Link from "next/link";
import {
  GraduationCap,
  Users,
  BookOpenCheck,
  Info,
} from "lucide-react";

type Role = "student" | "parent" | "teacher";
type Mode = "login" | "signup";

const ROLE_TABS: { role: Role; label: string; icon: typeof GraduationCap }[] = [
  { role: "student", label: "Student", icon: GraduationCap },
  { role: "parent", label: "Parent", icon: Users },
  { role: "teacher", label: "Teacher", icon: BookOpenCheck },
];

function isRole(value: string | undefined): value is Role {
  return value === "student" || value === "parent" || value === "teacher";
}

export default function LoginForm({
  initialRole,
  initialMode,
}: {
  initialRole?: string;
  initialMode?: string;
}) {
  const [role, setRole] = useState<Role>(
    isRole(initialRole) ? initialRole : "student",
  );
  const [mode, setMode] = useState<Mode>(
    initialMode === "signup" ? "signup" : "login",
  );

  return (
    <div className="w-full max-w-md">
      <div className="grid grid-cols-3 gap-2">
        {ROLE_TABS.map(({ role: r, label, icon: Icon }) => (
          <button
            key={r}
            type="button"
            onClick={() => setRole(r)}
            className={`flex flex-col items-center gap-1.5 rounded-2xl border px-3 py-3 text-xs font-semibold transition-colors ${
              role === r
                ? "border-brand-blue bg-brand-blue/10 text-brand-blue"
                : "border-zinc-200 bg-white text-zinc-500 hover:border-zinc-300"
            }`}
          >
            <Icon className="h-5 w-5" />
            {label}
          </button>
        ))}
      </div>

      <div className="mt-8 rounded-3xl border border-zinc-200 bg-white p-8 shadow-sm">
        <div className="flex items-center gap-2 rounded-full bg-zinc-100 p-1">
          <button
            type="button"
            onClick={() => setMode("login")}
            className={`flex-1 rounded-full py-2 text-sm font-semibold transition-colors ${
              mode === "login"
                ? "bg-white text-zinc-900 shadow-sm"
                : "text-zinc-500"
            }`}
          >
            Log In
          </button>
          <button
            type="button"
            onClick={() => setMode("signup")}
            className={`flex-1 rounded-full py-2 text-sm font-semibold transition-colors ${
              mode === "signup"
                ? "bg-white text-zinc-900 shadow-sm"
                : "text-zinc-500"
            }`}
          >
            Sign Up
          </button>
        </div>

        <h1 className="mt-6 text-xl font-bold text-zinc-900">
          {mode === "login" ? "Welcome back" : "Create your account"}
        </h1>
        <p className="mt-1 text-sm text-zinc-500">
          Continuing as a{" "}
          <span className="font-semibold capitalize text-zinc-700">
            {role}
          </span>
          .
        </p>

        <form className="mt-6 space-y-4" onSubmit={(e) => e.preventDefault()}>
          {mode === "signup" && (
            <div>
              <label className="mb-1.5 block text-sm font-medium text-zinc-700">
                Full name
              </label>
              <input
                type="text"
                placeholder="Jane Doe"
                className="w-full rounded-xl border border-zinc-300 px-4 py-2.5 text-sm outline-none placeholder:text-zinc-400 focus:border-brand-blue focus:ring-2 focus:ring-brand-blue/15"
              />
            </div>
          )}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-zinc-700">
              Email address
            </label>
            <input
              type="email"
              placeholder="you@example.com"
              className="w-full rounded-xl border border-zinc-300 px-4 py-2.5 text-sm outline-none placeholder:text-zinc-400 focus:border-brand-blue focus:ring-2 focus:ring-brand-blue/15"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-zinc-700">
              Password
            </label>
            <input
              type="password"
              placeholder="••••••••"
              className="w-full rounded-xl border border-zinc-300 px-4 py-2.5 text-sm outline-none placeholder:text-zinc-400 focus:border-brand-blue focus:ring-2 focus:ring-brand-blue/15"
            />
          </div>

          <button
            type="submit"
            disabled
            title="Coming soon"
            className="w-full cursor-not-allowed rounded-xl bg-brand-blue/50 py-3 text-sm font-semibold text-white"
          >
            {mode === "login" ? "Log In" : "Create Account"}
          </button>
        </form>

        <div className="mt-5 flex items-center gap-3">
          <span className="h-px flex-1 bg-zinc-200" />
          <span className="text-xs text-zinc-400">or continue with</span>
          <span className="h-px flex-1 bg-zinc-200" />
        </div>

        <div className="mt-4 grid grid-cols-3 gap-3">
          {["Google", "Facebook", "Apple"].map((provider) => (
            <button
              key={provider}
              type="button"
              disabled
              title="Coming soon"
              className="cursor-not-allowed rounded-xl border border-zinc-200 py-2.5 text-xs font-semibold text-zinc-400"
            >
              {provider}
            </button>
          ))}
        </div>

        <div className="mt-5 flex items-start gap-2 rounded-xl bg-brand-orange/10 px-3.5 py-3 text-xs leading-5 text-brand-orange-dark">
          <Info className="mt-0.5 h-4 w-4 shrink-0" />
          Account creation and sign-in aren&apos;t live yet — this is a
          preview of the MyTuto login experience.
        </div>
      </div>

      <p className="mt-6 text-center text-sm text-zinc-500">
        <Link href="/" className="font-semibold text-brand-blue hover:text-brand-blue-dark">
          &larr; Back to home
        </Link>
      </p>
    </div>
  );
}
