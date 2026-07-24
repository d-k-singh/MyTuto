"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { LogOut } from "lucide-react";
import { useAuth } from "@/lib/auth";

export default function DashboardHeader() {
  const router = useRouter();
  const { user, logout } = useAuth();

  async function handleLogout() {
    await logout();
    router.push("/");
    router.refresh();
  }

  return (
    <header className="sticky top-0 z-50 border-b border-zinc-200/70 bg-white/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-4 sm:px-6">
        <Link href="/" className="flex items-center">
          <Image
            src="/logo-wordmark.png"
            alt="MyTuto — Connect, Learn, Achieve"
            width={1237}
            height={280}
            priority
            className="h-9 w-auto sm:h-10"
          />
        </Link>

        <div className="flex items-center gap-3">
          {user && (
            <span className="hidden text-sm text-zinc-600 sm:inline">
              Hi, <span className="font-semibold text-zinc-900">{user.name.split(" ")[0]}</span>
            </span>
          )}
          <button
            type="button"
            onClick={handleLogout}
            className="flex items-center gap-1.5 rounded-full border border-zinc-200 px-4 py-2 text-sm font-medium text-zinc-700 transition-colors hover:border-zinc-300 hover:bg-zinc-50"
          >
            <LogOut className="h-4 w-4" />
            Log Out
          </button>
        </div>
      </div>
    </header>
  );
}
