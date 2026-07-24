"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  GraduationCap,
  Users,
  BookOpenCheck,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { api, ApiError } from "@/lib/api";
import { storeSession, type AuthUser } from "@/lib/auth";

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

type AuthResponse = { user: AuthUser; token: string };

export default function LoginForm({
  initialRole,
  initialMode,
}: {
  initialRole?: string;
  initialMode?: string;
}) {
  const router = useRouter();
  const [role, setRole] = useState<Role>(
    isRole(initialRole) ? initialRole : "student",
  );
  const [mode, setMode] = useState<Mode>(
    initialMode === "signup" ? "signup" : "login",
  );

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirmation, setPasswordConfirmation] = useState("");

  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  function switchMode(next: Mode) {
    setMode(next);
    setFieldErrors({});
    setFormError(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setFieldErrors({});
    setFormError(null);

    try {
      const response =
        mode === "signup"
          ? await api.post<AuthResponse>("/auth/register", {
              name,
              email,
              password,
              password_confirmation: passwordConfirmation,
              role,
            })
          : await api.post<AuthResponse>("/auth/login", { email, password });

      storeSession(response.token, response.user);
      router.push("/");
      router.refresh();
    } catch (err) {
      if (err instanceof ApiError) {
        const nextFieldErrors: Record<string, string> = {};
        for (const [field, messages] of Object.entries(err.errors)) {
          nextFieldErrors[field] = messages[0];
        }
        setFieldErrors(nextFieldErrors);
        if (Object.keys(nextFieldErrors).length === 0) {
          setFormError(err.message);
        }
      } else {
        setFormError("Something went wrong. Please try again.");
      }
    } finally {
      setSubmitting(false);
    }
  }

  const inputClass = (field: string) =>
    `w-full rounded-xl border px-4 py-2.5 text-sm outline-none placeholder:text-zinc-400 focus:ring-2 ${
      fieldErrors[field]
        ? "border-red-400 focus:border-red-400 focus:ring-red-100"
        : "border-zinc-300 focus:border-brand-blue focus:ring-brand-blue/15"
    }`;

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
            onClick={() => switchMode("login")}
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
            onClick={() => switchMode("signup")}
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

        {formError && (
          <div className="mt-4 flex items-start gap-2 rounded-xl bg-red-50 px-3.5 py-3 text-xs leading-5 text-red-700">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            {formError}
          </div>
        )}

        <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
          {mode === "signup" && (
            <div>
              <label className="mb-1.5 block text-sm font-medium text-zinc-700">
                Full name
              </label>
              <input
                type="text"
                placeholder="Jane Doe"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className={inputClass("name")}
              />
              {fieldErrors.name && (
                <p className="mt-1 text-xs text-red-600">{fieldErrors.name}</p>
              )}
            </div>
          )}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-zinc-700">
              Email address
            </label>
            <input
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className={inputClass("email")}
            />
            {fieldErrors.email && (
              <p className="mt-1 text-xs text-red-600">{fieldErrors.email}</p>
            )}
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-zinc-700">
              Password
            </label>
            <input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
              className={inputClass("password")}
            />
            {fieldErrors.password && (
              <p className="mt-1 text-xs text-red-600">{fieldErrors.password}</p>
            )}
          </div>
          {mode === "signup" && (
            <div>
              <label className="mb-1.5 block text-sm font-medium text-zinc-700">
                Confirm password
              </label>
              <input
                type="password"
                placeholder="••••••••"
                value={passwordConfirmation}
                onChange={(e) => setPasswordConfirmation(e.target.value)}
                required
                minLength={8}
                className={inputClass("password_confirmation")}
              />
            </div>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-brand-blue py-3 text-sm font-semibold text-white transition-colors hover:bg-brand-blue-dark disabled:cursor-not-allowed disabled:opacity-60"
          >
            {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
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
      </div>

      <p className="mt-6 text-center text-sm text-zinc-500">
        <Link href="/" className="font-semibold text-brand-blue hover:text-brand-blue-dark">
          &larr; Back to home
        </Link>
      </p>
    </div>
  );
}
