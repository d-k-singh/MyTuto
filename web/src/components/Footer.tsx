import Link from "next/link";
import Image from "next/image";

const COLUMNS = [
  {
    title: "Learn",
    links: [
      { label: "Find a Tutor", href: "/login?role=student&mode=signup" },
      { label: "For Parents", href: "/login?role=parent&mode=signup" },
      { label: "How It Works", href: "#how-it-works" },
    ],
  },
  {
    title: "Teach",
    links: [
      { label: "Become a Tutor", href: "/login?role=teacher&mode=signup" },
      { label: "Teacher Login", href: "/login?role=teacher" },
      { label: "Pricing & Payouts", href: "#teach" },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "About MyTuto", href: "#" },
      { label: "Trust & Safety", href: "#features" },
      { label: "Contact Us", href: "#" },
    ],
  },
  {
    title: "Legal",
    links: [
      { label: "Terms of Service", href: "#" },
      { label: "Privacy Policy", href: "#" },
      { label: "Cookie Policy", href: "#" },
    ],
  },
];

export default function Footer() {
  return (
    <footer className="border-t border-zinc-200 bg-white">
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="grid gap-10 lg:grid-cols-5">
          <div className="lg:col-span-1">
            <Link href="/">
              <Image
                src="/logo-header.png"
                alt="MyTuto"
                width={339}
                height={240}
                className="h-10 w-auto"
              />
            </Link>
            <p className="mt-3 text-sm font-bold tracking-wide">
              <span className="text-brand-blue">Connect</span>
              <span className="text-zinc-300"> &rarr; </span>
              <span className="text-brand-green">Learn</span>
              <span className="text-zinc-300"> &rarr; </span>
              <span className="text-brand-orange">Achieve</span>
            </p>
            <p className="mt-3 text-sm leading-6 text-zinc-500">
              The AI-powered education marketplace connecting students,
              parents, and tutors worldwide.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-8 sm:grid-cols-4 lg:col-span-4">
            {COLUMNS.map((col) => (
              <div key={col.title}>
                <h3 className="text-sm font-semibold text-zinc-900">
                  {col.title}
                </h3>
                <ul className="mt-4 space-y-3">
                  {col.links.map((link) => (
                    <li key={link.label}>
                      <Link
                        href={link.href}
                        className="text-sm text-zinc-500 transition-colors hover:text-zinc-800"
                      >
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-14 flex flex-col items-center justify-between gap-4 border-t border-zinc-200 pt-8 sm:flex-row">
          <p className="text-xs text-zinc-500">
            &copy; {new Date().getFullYear()} MyTuto (EduConnect Suite). All
            rights reserved.
          </p>
          <p className="text-xs text-zinc-400">www.mytuto.org</p>
        </div>
      </div>
    </footer>
  );
}
