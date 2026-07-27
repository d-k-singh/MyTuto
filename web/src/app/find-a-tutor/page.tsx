"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Loader2,
  AlertCircle,
  ShieldCheck,
  Heart,
  Send,
  Search,
  ExternalLink,
} from "lucide-react";
import { useAuth } from "@/lib/auth";
import { api, ApiError } from "@/lib/api";
import { COMMON_INDIAN_LANGUAGES } from "@/lib/languages";
import { TIME_BLOCKS } from "@/lib/timeBlocks";
import DashboardHeader from "@/components/dashboard/DashboardHeader";

type SubjectCategory = { id: number; name: string };

type CatalogSubject = {
  id: number;
  name: string;
  subject_category_id: number;
  grade_levels: string[] | null;
};

type TutorSearchResult = {
  teacher_profile_id: number;
  match_score: number;
  name: string;
  is_verified: boolean;
  subject: string;
  subject_category: string;
  grade_levels: string[];
  price_per_session_cp: number;
  languages: string[];
  bio_summary: string | null;
  is_shortlisted: boolean;
};

const GENDER_PREFERENCE_OPTIONS: { value: string; label: string }[] = [
  { value: "no_preference", label: "No Preference" },
  { value: "male", label: "Male" },
  { value: "female", label: "Female" },
];

const TEACHING_MODE_OPTIONS: { value: string; label: string }[] = [
  { value: "online", label: "Online" },
  { value: "in_person", label: "In person" },
  { value: "hybrid", label: "Hybrid" },
];

function inputClass(hasError = false) {
  return `w-full rounded-xl border px-3.5 py-2.5 text-sm outline-none placeholder:text-zinc-400 focus:ring-2 ${
    hasError
      ? "border-red-400 focus:border-red-400 focus:ring-red-100"
      : "border-zinc-300 focus:border-brand-blue focus:ring-brand-blue/15"
  }`;
}

export default function FindATutorPage() {
  const router = useRouter();
  const { ready, isAuthenticated, user, token } = useAuth();

  useEffect(() => {
    if (ready && !isAuthenticated) {
      router.replace("/login");
    }
  }, [ready, isAuthenticated, router]);

  if (!ready || !isAuthenticated || !user || !token) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-zinc-400" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-zinc-50">
      <DashboardHeader />
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8 sm:px-6">
        {user.role === "student" || user.role === "parent" ? (
          <FindATutorContent token={token} />
        ) : (
          <div className="rounded-3xl border border-zinc-200 bg-white p-8 text-center">
            <h1 className="text-lg font-bold text-zinc-900">
              This page is for students and parents
            </h1>
            <p className="mt-2 text-sm text-zinc-500">
              Find a Tutor is how students and parents search for a matching teacher.
            </p>
            <Link
              href="/"
              className="mt-6 inline-block rounded-full bg-brand-blue px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-blue-dark"
            >
              Back to home
            </Link>
          </div>
        )}
      </main>
    </div>
  );
}

function FindATutorContent({ token }: { token: string }) {
  const [categories, setCategories] = useState<SubjectCategory[]>([]);
  const [subjects, setSubjects] = useState<CatalogSubject[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [results, setResults] = useState<TutorSearchResult[] | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const [{ categories }, subjectsPage] = await Promise.all([
          api.get<{ categories: SubjectCategory[] }>("/subject-categories"),
          api.get<{ data: CatalogSubject[] }>("/subjects?per_page=200"),
        ]);
        if (cancelled) return;
        setCategories(categories);
        setSubjects(subjectsPage.data);
      } catch {
        if (!cancelled) setLoadError("Couldn't load subjects. Please try again shortly.");
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  if (loadError) {
    return (
      <div className="mx-auto mt-10 flex max-w-md items-start gap-2 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
        <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
        {loadError}
      </div>
    );
  }

  if (categories.length === 0 && subjects.length === 0) {
    return (
      <div className="flex justify-center py-24">
        <Loader2 className="h-6 w-6 animate-spin text-zinc-400" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-zinc-900">Find a Tutor</h1>
        <p className="mt-1 text-sm text-zinc-500">
          Tell us what you&apos;re looking for and we&apos;ll rank the best matches.
        </p>
      </div>

      <SearchForm
        token={token}
        categories={categories}
        subjects={subjects}
        onResults={setResults}
      />

      {results !== null && <ResultsList token={token} results={results} onResults={setResults} />}
    </div>
  );
}

function SearchForm({
  token,
  categories,
  subjects,
  onResults,
}: {
  token: string;
  categories: SubjectCategory[];
  subjects: CatalogSubject[];
  onResults: (results: TutorSearchResult[]) => void;
}) {
  const [subjectId, setSubjectId] = useState("");
  const [gradeLevel, setGradeLevel] = useState("");
  const [customGradeLevel, setCustomGradeLevel] = useState("");
  const [language, setLanguage] = useState("");
  const [languageOther, setLanguageOther] = useState("");
  const [geographicPreference, setGeographicPreference] = useState("");
  const [budgetMax, setBudgetMax] = useState("");
  const [genderPreference, setGenderPreference] = useState("no_preference");
  const [teachingMode, setTeachingMode] = useState("");
  const [timeBlock, setTimeBlock] = useState("");

  const [formError, setFormError] = useState<string | null>(null);
  const [searching, setSearching] = useState(false);

  const selectedSubject = subjects.find((s) => s.id === Number(subjectId));
  const gradeLevelOptions = selectedSubject?.grade_levels ?? [];

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSearching(true);
    setFormError(null);

    const resolvedGradeLevel = gradeLevelOptions.length > 0 ? gradeLevel : customGradeLevel;
    const resolvedLanguage = language === "other" ? languageOther : language;

    try {
      const params = new URLSearchParams({
        subject_id: subjectId,
        grade_level: resolvedGradeLevel,
        language: resolvedLanguage,
        geographic_preference: geographicPreference,
        budget_max: budgetMax,
        gender_preference: genderPreference,
        teaching_mode: teachingMode,
        time_block: timeBlock,
      });

      const response = await api.get<{ data: TutorSearchResult[] }>(
        `/tutors/search?${params.toString()}`,
        token,
      );
      onResults(response.data);
    } catch (err) {
      setFormError(err instanceof ApiError ? err.message : "Something went wrong. Please try again.");
    } finally {
      setSearching(false);
    }
  }

  return (
    <div className="rounded-3xl border border-zinc-200 bg-white p-6 sm:p-8">
      {formError && (
        <div className="mb-4 flex items-start gap-2 rounded-xl bg-red-50 px-3.5 py-3 text-xs leading-5 text-red-700">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          {formError}
        </div>
      )}

      <form className="grid gap-4 sm:grid-cols-2" onSubmit={handleSubmit}>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-zinc-700">Course / Subject</label>
          <select
            value={subjectId}
            onChange={(e) => {
              setSubjectId(e.target.value);
              setGradeLevel("");
            }}
            required
            className={inputClass()}
          >
            <option value="">Select...</option>
            {categories.map((category) => {
              const options = subjects.filter((s) => s.subject_category_id === category.id);
              if (options.length === 0) return null;
              return (
                <optgroup key={category.id} label={category.name}>
                  {options.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </optgroup>
              );
            })}
          </select>
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-zinc-700">
            Expertise level (grade / class)
          </label>
          {gradeLevelOptions.length > 0 ? (
            <select
              value={gradeLevel}
              onChange={(e) => setGradeLevel(e.target.value)}
              required
              className={inputClass()}
            >
              <option value="">Select...</option>
              {gradeLevelOptions.map((level) => (
                <option key={level} value={level}>
                  {level}
                </option>
              ))}
            </select>
          ) : (
            <input
              type="text"
              placeholder="e.g. Grade 10"
              value={customGradeLevel}
              onChange={(e) => setCustomGradeLevel(e.target.value)}
              required
              disabled={!subjectId}
              className={inputClass()}
            />
          )}
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-zinc-700">
            Language of instruction
          </label>
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            required
            className={inputClass()}
          >
            <option value="">Select...</option>
            {COMMON_INDIAN_LANGUAGES.map((lang) => (
              <option key={lang} value={lang}>
                {lang}
              </option>
            ))}
            <option value="other">Other</option>
          </select>
        </div>

        {language === "other" && (
          <div>
            <label className="mb-1.5 block text-sm font-medium text-zinc-700">
              Other language
            </label>
            <input
              type="text"
              placeholder="Type the language"
              value={languageOther}
              onChange={(e) => setLanguageOther(e.target.value)}
              required
              className={inputClass()}
            />
          </div>
        )}

        <div>
          <label className="mb-1.5 block text-sm font-medium text-zinc-700">
            Geographic preference
          </label>
          <select
            value={geographicPreference}
            onChange={(e) => setGeographicPreference(e.target.value)}
            required
            className={inputClass()}
          >
            <option value="">Select...</option>
            <option value="local">Local teacher</option>
            <option value="international">International teacher</option>
          </select>
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-zinc-700">
            Max budget per class (CP)
          </label>
          <input
            type="number"
            min={1}
            value={budgetMax}
            onChange={(e) => setBudgetMax(e.target.value)}
            required
            className={inputClass()}
          />
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-zinc-700">
            Gender preference
          </label>
          <select
            value={genderPreference}
            onChange={(e) => setGenderPreference(e.target.value)}
            className={inputClass()}
          >
            {GENDER_PREFERENCE_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-zinc-700">Teaching mode</label>
          <select
            value={teachingMode}
            onChange={(e) => setTeachingMode(e.target.value)}
            required
            className={inputClass()}
          >
            <option value="">Select...</option>
            {TEACHING_MODE_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-zinc-700">Preferred time</label>
          <select
            value={timeBlock}
            onChange={(e) => setTimeBlock(e.target.value)}
            required
            className={inputClass()}
          >
            <option value="">Select...</option>
            {TIME_BLOCKS.map((block) => (
              <option key={block.value} value={block.value}>
                {block.label}
              </option>
            ))}
          </select>
        </div>

        <div className="sm:col-span-2">
          <button
            type="submit"
            disabled={searching}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-brand-blue py-3 text-sm font-semibold text-white transition-colors hover:bg-brand-blue-dark disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto sm:px-8"
          >
            {searching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
            Search Tutors
          </button>
        </div>
      </form>
    </div>
  );
}

function ResultsList({
  token,
  results,
  onResults,
}: {
  token: string;
  results: TutorSearchResult[];
  onResults: (results: TutorSearchResult[]) => void;
}) {
  if (results.length === 0) {
    return (
      <div className="rounded-3xl border border-zinc-200 bg-white p-8 text-center text-sm text-zinc-500">
        No tutors matched your search. Try widening your budget or time preferences.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-sm font-medium text-zinc-500">
        {results.length} tutor{results.length === 1 ? "" : "s"} found
      </p>
      {results.map((result) => (
        <ResultCard
          key={result.teacher_profile_id}
          token={token}
          result={result}
          onUpdated={(updated) =>
            onResults(
              results.map((r) => (r.teacher_profile_id === updated.teacher_profile_id ? updated : r)),
            )
          }
        />
      ))}
    </div>
  );
}

function matchScoreColor(score: number) {
  if (score >= 80) return "bg-brand-green/10 text-brand-green-dark";
  if (score >= 50) return "bg-brand-orange/10 text-brand-orange-dark";
  return "bg-zinc-100 text-zinc-500";
}

function ResultCard({
  token,
  result,
  onUpdated,
}: {
  token: string;
  result: TutorSearchResult;
  onUpdated: (result: TutorSearchResult) => void;
}) {
  const [shortlisting, setShortlisting] = useState(false);
  const [enquiring, setEnquiring] = useState(false);
  const [message, setMessage] = useState("");
  const [enquirySent, setEnquirySent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function toggleShortlist() {
    setShortlisting(true);
    setError(null);
    try {
      if (result.is_shortlisted) {
        await api.delete(`/tutors/${result.teacher_profile_id}/shortlist`, token);
      } else {
        await api.post(`/tutors/${result.teacher_profile_id}/shortlist`, undefined, token);
      }
      onUpdated({ ...result, is_shortlisted: !result.is_shortlisted });
    } catch {
      setError("Couldn't update your shortlist. Please try again.");
    } finally {
      setShortlisting(false);
    }
  }

  async function submitEnquiry(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      await api.post(`/tutors/${result.teacher_profile_id}/enquiries`, { message }, token);
      setEnquirySent(true);
      setEnquiring(false);
      setMessage("");
    } catch {
      setError("Couldn't send your enquiry. Please try again.");
    }
  }

  return (
    <div className="rounded-3xl border border-zinc-200 bg-white p-6 sm:p-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <p className="text-base font-bold text-zinc-900">{result.name}</p>
            {result.is_verified && (
              <span className="flex items-center gap-1 rounded-full bg-brand-blue/10 px-2 py-0.5 text-xs font-medium text-brand-blue">
                <ShieldCheck className="h-3.5 w-3.5" />
                Verified
              </span>
            )}
          </div>
          <p className="mt-0.5 text-sm text-zinc-500">
            {result.subject} <span className="text-zinc-400">· {result.subject_category}</span>
          </p>
          <p className="mt-1 text-xs text-zinc-400">{result.grade_levels.join(", ")}</p>
        </div>
        <div className={`rounded-full px-3 py-1 text-sm font-semibold ${matchScoreColor(result.match_score)}`}>
          {result.match_score}% match
        </div>
      </div>

      {result.bio_summary && (
        <p className="mt-4 text-sm leading-6 text-zinc-600">{result.bio_summary}</p>
      )}

      <div className="mt-4 flex flex-wrap items-center gap-x-6 gap-y-1 text-sm text-zinc-600">
        <span className="font-medium text-brand-blue">
          {result.price_per_session_cp} CP / session
        </span>
        {result.languages.length > 0 && <span>{result.languages.join(", ")}</span>}
      </div>

      {error && (
        <div className="mt-4 flex items-start gap-2 rounded-xl bg-red-50 px-3.5 py-3 text-xs leading-5 text-red-700">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      {enquiring && (
        <form className="mt-4 space-y-2" onSubmit={submitEnquiry}>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Introduce yourself and ask your question..."
            required
            rows={3}
            maxLength={1000}
            className={inputClass()}
          />
          <div className="flex gap-2">
            <button
              type="submit"
              className="rounded-xl bg-brand-blue px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-brand-blue-dark"
            >
              Send
            </button>
            <button
              type="button"
              onClick={() => setEnquiring(false)}
              className="rounded-xl border border-zinc-200 px-4 py-2 text-sm font-medium text-zinc-700 hover:border-zinc-300 hover:bg-zinc-50"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      <div className="mt-5 flex flex-wrap items-center gap-3 border-t border-zinc-100 pt-5">
        <Link
          href={`/teachers/${result.teacher_profile_id}`}
          className="flex items-center gap-1.5 text-sm font-semibold text-brand-blue hover:text-brand-blue-dark"
        >
          Full profile
          <ExternalLink className="h-3.5 w-3.5" />
        </Link>

        {!enquiring && !enquirySent && (
          <button
            type="button"
            onClick={() => setEnquiring(true)}
            className="ml-auto flex items-center gap-1.5 rounded-full bg-brand-blue px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-brand-blue-dark"
          >
            <Send className="h-3.5 w-3.5" />
            Enquire Now
          </button>
        )}
        {enquirySent && (
          <span className="ml-auto text-sm font-medium text-brand-green">Enquiry sent</span>
        )}

        <button
          type="button"
          disabled={shortlisting}
          onClick={toggleShortlist}
          className={`flex items-center gap-1.5 rounded-full border px-4 py-2 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${
            result.is_shortlisted
              ? "border-brand-pink/30 bg-brand-pink/5 text-brand-pink"
              : "border-zinc-200 text-zinc-700 hover:border-zinc-300 hover:bg-zinc-50"
          }`}
        >
          <Heart className={`h-3.5 w-3.5 ${result.is_shortlisted ? "fill-brand-pink" : ""}`} />
          {result.is_shortlisted ? "Shortlisted" : "Save to Shortlist"}
        </button>
      </div>
    </div>
  );
}
