import {
  Sparkles,
  ShieldCheck,
  Wallet,
  Video,
  Globe2,
  BadgeCheck,
} from "lucide-react";

const FEATURES = [
  {
    icon: Sparkles,
    title: "AI-powered matching",
    description:
      "A weighted match score compares subject, level, budget, language, and availability — so search results are ranked by real fit, not just filters.",
    color: "text-brand-purple",
    bg: "bg-brand-purple/10",
  },
  {
    icon: ShieldCheck,
    title: "Privacy-first contact",
    description:
      "Personal contact details stay hidden until a booking is confirmed. All messages are AI-monitored to keep the platform safe.",
    color: "text-brand-navy",
    bg: "bg-brand-navy/10",
  },
  {
    icon: Wallet,
    title: "Simple credit wallet",
    description:
      "Top up once, use credits to enquire and book. Automatic refunds if a tutor doesn't respond in time.",
    color: "text-brand-orange",
    bg: "bg-brand-orange/10",
  },
  {
    icon: Video,
    title: "Live classes, built in",
    description:
      "Sessions connect automatically to Zoom or Google Meet with join links and reminders — no extra setup required.",
    color: "text-brand-blue",
    bg: "bg-brand-blue/10",
  },
  {
    icon: BadgeCheck,
    title: "Verified tutors",
    description:
      "Identity, education, and background-check badges are visible on every profile, so you know exactly who you're learning from.",
    color: "text-brand-green",
    bg: "bg-brand-green/10",
  },
  {
    icon: Globe2,
    title: "Global reach",
    description:
      "Multi-currency pricing and 40+ supported countries mean the right tutor is never limited by geography.",
    color: "text-brand-pink",
    bg: "bg-brand-pink/10",
  },
];

export default function Features() {
  return (
    <section id="features" className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-2xl text-center">
        <h2 className="text-3xl font-extrabold tracking-tight text-zinc-900 sm:text-4xl">
          Everything you need, nothing you don&apos;t
        </h2>
        <p className="mt-4 text-lg text-zinc-600">
          A marketplace designed around trust, privacy, and great teaching.
        </p>
      </div>

      <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {FEATURES.map(({ icon: Icon, title, description, color, bg }) => (
          <div
            key={title}
            className="rounded-2xl border border-zinc-200 p-6 transition-colors hover:border-brand-blue/20 hover:bg-brand-blue/5"
          >
            <span
              className={`flex h-11 w-11 items-center justify-center rounded-xl ${bg} ${color}`}
            >
              <Icon className="h-5 w-5" />
            </span>
            <h3 className="mt-4 text-base font-bold text-zinc-900">{title}</h3>
            <p className="mt-2 text-sm leading-6 text-zinc-600">
              {description}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
