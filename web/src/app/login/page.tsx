import Link from "next/link";
import Image from "next/image";
import LoginForm from "@/components/LoginForm";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ role?: string; mode?: string }>;
}) {
  const { role, mode } = await searchParams;

  return (
    <div className="flex min-h-screen flex-1 flex-col items-center justify-center bg-gradient-to-b from-brand-blue/5 via-white to-white px-4 py-16">
      <Link href="/" className="mb-8">
        <Image
          src="/logo-wordmark.png"
          alt="MyTuto — Connect, Learn, Achieve"
          width={1237}
          height={280}
          priority
          className="h-11 w-auto"
        />
      </Link>

      <LoginForm initialRole={role} initialMode={mode} />
    </div>
  );
}
