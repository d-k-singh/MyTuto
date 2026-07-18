import { Star } from "lucide-react";

const TESTIMONIALS = [
  {
    quote:
      "The AI match score genuinely saved me hours of searching. Found an IGCSE physics tutor who fit our budget and schedule in one afternoon.",
    name: "Meera N.",
    role: "Parent, Bengaluru",
  },
  {
    quote:
      "I like that my number stays private until I've actually accepted a booking. Enquiries feel serious, not spammy.",
    name: "Daniel K.",
    role: "English Tutor, Manila",
  },
  {
    quote:
      "Booking, payment, and the Zoom link all happen automatically. It just works, every time.",
    name: "Aisha R.",
    role: "Student, Toronto",
  },
];

export default function Testimonials() {
  return (
    <section className="bg-zinc-50 py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-extrabold tracking-tight text-zinc-900 sm:text-4xl">
            Loved by students, parents & teachers
          </h2>
        </div>

        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {TESTIMONIALS.map(({ quote, name, role }) => (
            <figure
              key={name}
              className="flex flex-col rounded-2xl border border-zinc-200 bg-white p-6"
            >
              <div className="flex gap-0.5">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    className="h-4 w-4 fill-brand-orange text-brand-orange"
                  />
                ))}
              </div>
              <blockquote className="mt-4 flex-1 text-sm leading-6 text-zinc-600">
                &ldquo;{quote}&rdquo;
              </blockquote>
              <figcaption className="mt-5 border-t border-zinc-100 pt-4">
                <p className="text-sm font-semibold text-zinc-900">{name}</p>
                <p className="text-xs text-zinc-500">{role}</p>
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}
