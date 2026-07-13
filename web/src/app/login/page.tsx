import Link from "next/link";
import { GraduationCap } from "lucide-react";
import LoginForm from "@/components/LoginForm";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ role?: string; mode?: string }>;
}) {
  const { role, mode } = await searchParams;

  return (
    <div className="flex min-h-screen flex-1 flex-col items-center justify-center bg-gradient-to-b from-indigo-50 via-white to-white px-4 py-16">
      <Link href="/" className="mb-8 flex items-center gap-2">
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-600 text-white">
          <GraduationCap className="h-5 w-5" />
        </span>
        <span className="text-lg font-extrabold tracking-tight text-zinc-900">
          MyTuto
        </span>
      </Link>

      <LoginForm initialRole={role} initialMode={mode} />
    </div>
  );
}
