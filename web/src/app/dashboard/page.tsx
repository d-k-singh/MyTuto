"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import { useAuth, isAllowedOnHost, ADMIN_HOSTNAME } from "@/lib/auth";
import StudentDashboard from "@/components/dashboard/StudentDashboard";
import ParentDashboard from "@/components/dashboard/ParentDashboard";
import TeacherDashboard from "@/components/dashboard/TeacherDashboard";
import AdminDashboard from "@/components/dashboard/AdminDashboard";

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

  if (!isAllowedOnHost(user.role, window.location.hostname)) {
    const isAdminRole = user.role === "admin" || user.role === "super_admin";
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-50 px-4">
        <div className="rounded-3xl border border-zinc-200 bg-white p-8 text-center">
          <h1 className="text-lg font-bold text-zinc-900">Wrong address</h1>
          <p className="mt-2 max-w-sm text-sm text-zinc-500">
            {isAdminRole
              ? `Administrator accounts sign in at ${ADMIN_HOSTNAME}, not here.`
              : "This address is for administrator accounts only."}
          </p>
          <a
            href={isAdminRole ? `https://${ADMIN_HOSTNAME}/login` : "/"}
            className="mt-6 inline-block rounded-full bg-brand-blue px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-blue-dark"
          >
            {isAdminRole ? "Go to admin sign in" : "Back to home"}
          </a>
        </div>
      </div>
    );
  }

  if (user.role === "student") return <StudentDashboard token={token} />;
  if (user.role === "parent") return <ParentDashboard token={token} />;
  if (user.role === "teacher") return <TeacherDashboard token={token} />;
  if (user.role === "admin" || user.role === "super_admin") return <AdminDashboard token={token} />;

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 px-4">
      <ComingSoon role={user.role} />
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
