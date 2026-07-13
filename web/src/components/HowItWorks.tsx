import { Search, MessageCircleHeart, Video } from "lucide-react";

const STEPS = [
  {
    icon: Search,
    title: "Search & get matched",
    description:
      "Tell us your subject, level, budget, and schedule. Our AI scores every tutor for compatibility and surfaces your best matches first.",
  },
  {
    icon: MessageCircleHeart,
    title: "Enquire, privately",
    description:
      "Message a tutor without exposing contact details. Nobody's phone number or email is shared until a booking is confirmed.",
  },
  {
    icon: Video,
    title: "Book & join live",
    description:
      "Confirm a session and join over Zoom or Google Meet. Pay securely, track attendance, and download certificates when you're done.",
  },
];

export default function HowItWorks() {
  return (
    <section id="how-it-works" className="bg-zinc-50 py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-extrabold tracking-tight text-zinc-900 sm:text-4xl">
            How MyTuto works
          </h2>
          <p className="mt-4 text-lg text-zinc-600">
            Three steps from search to your first class.
          </p>
        </div>

        <div className="mt-14 grid gap-8 md:grid-cols-3">
          {STEPS.map(({ icon: Icon, title, description }, i) => (
            <div key={title} className="relative">
              <div className="flex items-center gap-4">
                <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white text-indigo-600 shadow-md shadow-zinc-900/5">
                  <Icon className="h-7 w-7" />
                </span>
                <span className="text-5xl font-black text-zinc-200">
                  {String(i + 1).padStart(2, "0")}
                </span>
              </div>
              <h3 className="mt-5 text-lg font-bold text-zinc-900">{title}</h3>
              <p className="mt-2 text-sm leading-6 text-zinc-600">
                {description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
