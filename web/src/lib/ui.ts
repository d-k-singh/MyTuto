/** Shared Tailwind classes for form inputs across dashboard and search forms. */
export function inputClass(hasError = false): string {
  return `w-full rounded-xl border px-3.5 py-2.5 text-sm outline-none placeholder:text-zinc-400 focus:ring-2 ${
    hasError
      ? "border-red-400 focus:border-red-400 focus:ring-red-100"
      : "border-zinc-300 focus:border-brand-blue focus:ring-brand-blue/15"
  }`;
}
