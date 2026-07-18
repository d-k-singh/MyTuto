import Link from "next/link";
import { CheckCircle2 } from "lucide-react";

const POINTS = [
  "Set your own hourly rate, per subject and per country",
  "Get discovered through AI-powered student matching",
  "Secure payouts within 48 hours of class completion",
  "Free onboarding credits to get your first enquiries",
];

export default function TeacherCta() {
  return (
    <section id="teach" className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-zinc-900 via-zinc-900 to-brand-navy px-8 py-14 sm:px-14">
        <div
          aria-hidden
          className="pointer-events-none absolute -right-16 -top-16 h-72 w-72 rounded-full bg-brand-blue/25 blur-3xl"
        />
        <div className="relative grid gap-10 lg:grid-cols-2 lg:items-center">
          <div>
            <span className="inline-flex items-center rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-brand-orange">
              For Teachers
            </span>
            <h2 className="mt-5 text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
              Turn your expertise into a global tutoring business
            </h2>
            <p className="mt-4 max-w-lg text-zinc-300">
              Join a marketplace built to help great teachers reach students
              anywhere — with the tools to manage bookings, payments, and
              performance in one dashboard.
            </p>
            <Link
              href="/login?role=teacher&mode=signup"
              className="mt-8 inline-block rounded-full bg-white px-6 py-3.5 text-base font-semibold text-zinc-900 transition-colors hover:bg-zinc-100"
            >
              Apply to Teach
            </Link>
          </div>

          <ul className="space-y-4">
            {POINTS.map((point) => (
              <li key={point} className="flex items-start gap-3">
                <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-brand-green" />
                <span className="text-sm leading-6 text-zinc-200">{point}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
