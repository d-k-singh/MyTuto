"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Menu, X } from "lucide-react";
import LoginMenu from "./LoginMenu";

const NAV_LINKS = [
  { href: "#how-it-works", label: "How It Works" },
  { href: "#roles", label: "For You" },
  { href: "#features", label: "Features" },
  { href: "#teach", label: "Become a Tutor" },
];

export default function Header() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-zinc-200/70 bg-white/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center">
          <Image
            src="/logo-wordmark.png"
            alt="MyTuto — Connect, Learn, Achieve"
            width={1237}
            height={280}
            priority
            className="h-10 w-auto sm:h-11"
          />
        </Link>

        <nav className="hidden items-center gap-8 lg:flex">
          {NAV_LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="text-sm font-medium text-zinc-600 transition-colors hover:text-zinc-900"
            >
              {link.label}
            </a>
          ))}
        </nav>

        <div className="hidden items-center gap-3 lg:flex">
          <LoginMenu />
          <Link
            href="/login?role=student&mode=signup"
            className="rounded-full bg-brand-blue px-4 py-2 text-sm font-semibold text-white shadow-sm shadow-brand-blue/30 transition-colors hover:bg-brand-blue-dark"
          >
            Get Started Free
          </Link>
        </div>

        <button
          type="button"
          className="flex h-10 w-10 items-center justify-center rounded-lg text-zinc-700 lg:hidden"
          onClick={() => setMobileOpen((v) => !v)}
          aria-label="Toggle menu"
        >
          {mobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {mobileOpen && (
        <div className="border-t border-zinc-200 bg-white px-4 py-4 lg:hidden">
          <nav className="flex flex-col gap-1">
            {NAV_LINKS.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                className="rounded-lg px-3 py-2.5 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
              >
                {link.label}
              </a>
            ))}
          </nav>
          <div className="mt-4 flex flex-col gap-2 border-t border-zinc-200 pt-4">
            <p className="px-3 text-xs font-semibold uppercase tracking-wide text-zinc-400">
              Log in as
            </p>
            <div className="flex flex-col gap-1">
              {["student", "parent", "teacher"].map((role) => (
                <Link
                  key={role}
                  href={`/login?role=${role}`}
                  onClick={() => setMobileOpen(false)}
                  className="rounded-lg px-3 py-2.5 text-sm font-medium capitalize text-zinc-700 hover:bg-zinc-50"
                >
                  {role}
                </Link>
              ))}
            </div>
            <Link
              href="/login?role=student&mode=signup"
              onClick={() => setMobileOpen(false)}
              className="mt-2 rounded-full bg-brand-blue px-4 py-2.5 text-center text-sm font-semibold text-white"
            >
              Get Started Free
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
