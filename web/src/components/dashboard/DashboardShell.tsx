"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { LogOut, Menu, X, type LucideIcon } from "lucide-react";
import { useAuth } from "@/lib/auth";

export type DashboardSection = {
  id: string;
  label: string;
  icon: LucideIcon;
};

const ROLE_LABELS: Record<string, string> = {
  student: "Student",
  parent: "Parent",
  teacher: "Teacher",
  admin: "Administrator",
  super_admin: "Super Administrator",
};

export default function DashboardShell({
  sections,
  activeSection,
  onSectionChange,
  children,
}: {
  sections: DashboardSection[];
  activeSection: string;
  onSectionChange: (id: string) => void;
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { user, logout } = useAuth();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  async function handleLogout() {
    await logout();
    router.push("/");
    router.refresh();
  }

  const activeLabel = sections.find((s) => s.id === activeSection)?.label ?? "Dashboard";

  return (
    <div className="flex min-h-screen bg-zinc-50">
      {mobileNavOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 sm:hidden"
          onClick={() => setMobileNavOpen(false)}
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-64 shrink-0 flex-col bg-zinc-900 transition-transform sm:static sm:translate-x-0 ${
          mobileNavOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex h-16 items-center justify-between gap-2 px-5">
          <Image
            src="/logo-wordmark.png"
            alt="MyTuto — Connect, Learn, Achieve"
            width={1237}
            height={280}
            className="h-8 w-auto brightness-0 invert"
          />
          <button
            type="button"
            onClick={() => setMobileNavOpen(false)}
            className="text-zinc-400 sm:hidden"
            aria-label="Close menu"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="mt-4 flex-1 space-y-1 px-3">
          {sections.map((section) => {
            const Icon = section.icon;
            const isActive = section.id === activeSection;
            return (
              <button
                key={section.id}
                type="button"
                onClick={() => {
                  onSectionChange(section.id);
                  setMobileNavOpen(false);
                }}
                className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-zinc-800 text-white"
                    : "text-zinc-400 hover:bg-zinc-800/60 hover:text-zinc-100"
                }`}
              >
                <Icon className="h-4 w-4 shrink-0" />
                {section.label}
              </button>
            );
          })}
        </nav>

        <div className="border-t border-zinc-800 p-4 text-xs text-zinc-500">
          &copy; {new Date().getFullYear()} MyTuto
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-zinc-200 bg-white px-4 sm:px-6">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setMobileNavOpen(true)}
              className="text-zinc-500 sm:hidden"
              aria-label="Open menu"
            >
              <Menu className="h-5 w-5" />
            </button>
            <h1 className="text-base font-bold text-zinc-900">{activeLabel}</h1>
          </div>

          <div className="flex items-center gap-3">
            {user && (
              <span className="hidden text-sm text-zinc-600 sm:inline">
                {user.name}{" "}
                <span className="text-zinc-400">&middot; {ROLE_LABELS[user.role] ?? user.role}</span>
              </span>
            )}
            <button
              type="button"
              onClick={handleLogout}
              className="flex items-center gap-1.5 rounded-full border border-zinc-200 px-4 py-2 text-sm font-medium text-zinc-700 transition-colors hover:border-zinc-300 hover:bg-zinc-50"
            >
              <LogOut className="h-4 w-4" />
              Logout
            </button>
          </div>
        </header>

        <main className="flex-1 p-4 sm:p-6">
          <div className="mx-auto w-full max-w-6xl">{children}</div>
        </main>
      </div>
    </div>
  );
}
