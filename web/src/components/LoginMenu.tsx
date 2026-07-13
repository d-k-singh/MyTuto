"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ChevronDown, GraduationCap, Users, BookOpenCheck } from "lucide-react";

const ROLES = [
  {
    role: "student",
    label: "Student",
    description: "Find a tutor & keep learning",
    icon: GraduationCap,
  },
  {
    role: "parent",
    label: "Parent",
    description: "Manage your child's learning",
    icon: Users,
  },
  {
    role: "teacher",
    label: "Teacher",
    description: "Access your teaching dashboard",
    icon: BookOpenCheck,
  },
] as const;

export default function LoginMenu() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-haspopup="menu"
        className="flex items-center gap-1.5 rounded-full border border-zinc-200 px-4 py-2 text-sm font-medium text-zinc-700 transition-colors hover:border-zinc-300 hover:bg-zinc-50"
      >
        Log In
        <ChevronDown
          className={`h-4 w-4 transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 z-50 mt-2 w-72 overflow-hidden rounded-2xl border border-zinc-200 bg-white p-2 shadow-xl shadow-zinc-900/10"
        >
          <p className="px-3 pb-1 pt-2 text-xs font-semibold uppercase tracking-wide text-zinc-400">
            Continue as
          </p>
          {ROLES.map(({ role, label, description, icon: Icon }) => (
            <Link
              key={role}
              href={`/login?role=${role}`}
              role="menuitem"
              onClick={() => setOpen(false)}
              className="flex items-start gap-3 rounded-xl px-3 py-2.5 transition-colors hover:bg-indigo-50"
            >
              <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
                <Icon className="h-5 w-5" />
              </span>
              <span>
                <span className="block text-sm font-semibold text-zinc-900">
                  {label}
                </span>
                <span className="block text-xs text-zinc-500">
                  {description}
                </span>
              </span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
