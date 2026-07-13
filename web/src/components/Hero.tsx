import Link from "next/link";
import { ShieldCheck, Sparkles, Star } from "lucide-react";

export default function Hero() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-indigo-50 via-white to-white">
      <div
        aria-hidden
        className="pointer-events-none absolute -top-24 right-0 h-96 w-96 rounded-full bg-amber-200/40 blur-3xl"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -left-24 top-40 h-72 w-72 rounded-full bg-indigo-200/50 blur-3xl"
      />

      <div className="relative mx-auto grid max-w-7xl gap-12 px-4 py-20 sm:px-6 lg:grid-cols-2 lg:items-center lg:px-8 lg:py-28">
        <div>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-indigo-100 px-3 py-1 text-xs font-semibold text-indigo-700">
            <Sparkles className="h-3.5 w-3.5" />
            AI-powered teacher matching
          </span>

          <h1 className="mt-5 text-4xl font-extrabold leading-tight tracking-tight text-zinc-900 sm:text-5xl lg:text-6xl">
            Find the right tutor.
            <br />
            <span className="bg-gradient-to-r from-indigo-600 to-violet-500 bg-clip-text text-transparent">
              Anywhere in the world.
            </span>
          </h1>

          <p className="mt-6 max-w-xl text-lg leading-8 text-zinc-600">
            MyTuto connects students and parents with verified, expert tutors
            through AI-powered matching — with privacy-first messaging, secure
            payments, and live classes built in.
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/login?role=student&mode=signup"
              className="rounded-full bg-indigo-600 px-6 py-3.5 text-center text-base font-semibold text-white shadow-lg shadow-indigo-600/25 transition-colors hover:bg-indigo-700"
            >
              Find a Tutor
            </Link>
            <Link
              href="/login?role=teacher&mode=signup"
              className="rounded-full border border-zinc-300 bg-white px-6 py-3.5 text-center text-base font-semibold text-zinc-800 transition-colors hover:border-zinc-400 hover:bg-zinc-50"
            >
              Become a Tutor
            </Link>
          </div>

          <div className="mt-10 flex flex-wrap items-center gap-x-8 gap-y-4">
            <div className="flex items-center gap-2 text-sm text-zinc-600">
              <ShieldCheck className="h-5 w-5 text-emerald-600" />
              Identity-verified tutors
            </div>
            <div className="flex items-center gap-2 text-sm text-zinc-600">
              <Star className="h-5 w-5 fill-amber-400 text-amber-400" />
              4.8/5 average rating
            </div>
          </div>
        </div>

        <div className="relative">
          <div className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-2xl shadow-zinc-900/10">
            <p className="text-xs font-semibold uppercase tracking-wide text-zinc-400">
              Top matches for you
            </p>
            <div className="mt-4 space-y-3">
              {[
                { name: "Aisha R.", subject: "IB Mathematics", match: 97 },
                { name: "Daniel K.", subject: "Spoken English", match: 93 },
                { name: "Priya S.", subject: "Physics · IGCSE", match: 90 },
              ].map((t) => (
                <div
                  key={t.name}
                  className="flex items-center justify-between rounded-2xl border border-zinc-100 bg-zinc-50/60 p-4"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-violet-500 text-sm font-bold text-white">
                      {t.name.charAt(0)}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-zinc-900">
                        {t.name}
                      </p>
                      <p className="text-xs text-zinc-500">{t.subject}</p>
                    </div>
                  </div>
                  <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-bold text-emerald-700">
                    {t.match}% match
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="absolute -bottom-6 -left-6 hidden rounded-2xl border border-zinc-200 bg-white px-5 py-4 shadow-xl shadow-zinc-900/10 sm:block">
            <p className="text-2xl font-extrabold text-zinc-900">40+</p>
            <p className="text-xs text-zinc-500">Countries reached</p>
          </div>
        </div>
      </div>
    </section>
  );
}
