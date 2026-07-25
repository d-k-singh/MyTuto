"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/lib/auth";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import StudentDashboard from "@/components/dashboard/StudentDashboard";
import ParentDashboard from "@/components/dashboard/ParentDashboard";

export default function DashboardPage() {
  const router = useRouter();
  const { ready, isAuthenticated, user, token } = useAuth();

  useEffect(() => {
    if (ready && !isAuthenticated) {
      router.replace("/login");
    }
  }, [ready, isAuthenticated, router]);

  if (!ready || !isAuthenticated || !user || !token) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-zinc-400" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-zinc-50">
      <DashboardHeader />
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8 sm:px-6">
        {user.role === "student" ? (
          <StudentDashboard token={token} />
        ) : user.role === "parent" ? (
          <ParentDashboard token={token} />
        ) : (
          <ComingSoon role={user.role} />
        )}
      </main>
    </div>
  );
}

function ComingSoon({ role }: { role: string }) {
  return (
    <div className="rounded-3xl border border-zinc-200 bg-white p-8 text-center">
      <h1 className="text-lg font-bold text-zinc-900">
        Your {role} dashboard is on its way
      </h1>
      <p className="mt-2 text-sm text-zinc-500">
        We&apos;re still building this part of MyTuto. Check back soon.
      </p>
      <Link
        href="/"
        className="mt-6 inline-block rounded-full bg-brand-blue px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-blue-dark"
      >
        Back to home
      </Link>
    </div>
  );
}
