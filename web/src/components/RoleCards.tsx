import Link from "next/link";
import {
  GraduationCap,
  Users,
  BookOpenCheck,
  ArrowRight,
} from "lucide-react";

const ROLES = [
  {
    role: "student",
    icon: GraduationCap,
    title: "I'm a Student",
    description:
      "Search verified tutors by subject, budget, and schedule. Get AI-matched recommendations and message teachers privately.",
    bullets: ["AI teacher matching", "Book & join live classes", "Track progress & certificates"],
    accent: "from-indigo-500 to-indigo-600",
  },
  {
    role: "parent",
    icon: Users,
    title: "I'm a Parent",
    description:
      "Manage one or more child profiles, set spending limits, approve tutors, and monitor progress — all from one dashboard.",
    bullets: ["Multi-child dashboard", "Spending & tutor controls", "Progress reports & alerts"],
    accent: "from-amber-500 to-orange-500",
  },
  {
    role: "teacher",
    icon: BookOpenCheck,
    title: "I'm a Teacher",
    description:
      "Build a global tutoring business. Set your own rates, manage enquiries, and get paid securely after every class.",
    bullets: ["Global student reach", "Flexible pricing & schedule", "Secure, timely payouts"],
    accent: "from-violet-500 to-purple-600",
  },
] as const;

export default function RoleCards() {
  return (
    <section id="roles" className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-2xl text-center">
        <h2 className="text-3xl font-extrabold tracking-tight text-zinc-900 sm:text-4xl">
          Built for every role in the learning journey
        </h2>
        <p className="mt-4 text-lg text-zinc-600">
          Pick where you belong and get straight to the dashboard made for you.
        </p>
      </div>

      <div className="mt-12 grid gap-6 md:grid-cols-3">
        {ROLES.map(({ role, icon: Icon, title, description, bullets, accent }) => (
          <div
            key={role}
            className="group flex flex-col rounded-3xl border border-zinc-200 bg-white p-8 transition-shadow hover:shadow-xl hover:shadow-zinc-900/5"
          >
            <span
              className={`flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br ${accent} text-white`}
            >
              <Icon className="h-6 w-6" />
            </span>
            <h3 className="mt-5 text-xl font-bold text-zinc-900">{title}</h3>
            <p className="mt-2 text-sm leading-6 text-zinc-600">{description}</p>

            <ul className="mt-5 space-y-2">
              {bullets.map((b) => (
                <li key={b} className="flex items-center gap-2 text-sm text-zinc-600">
                  <span className="h-1.5 w-1.5 rounded-full bg-zinc-400" />
                  {b}
                </li>
              ))}
            </ul>

            <div className="mt-6 flex items-center gap-4 border-t border-zinc-100 pt-5">
              <Link
                href={`/login?role=${role}&mode=signup`}
                className="text-sm font-semibold text-indigo-600 transition-colors hover:text-indigo-700"
              >
                Sign Up
              </Link>
              <Link
                href={`/login?role=${role}`}
                className="flex items-center gap-1 text-sm font-semibold text-zinc-700 transition-colors hover:text-zinc-900"
              >
                Log In
                <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
              </Link>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
