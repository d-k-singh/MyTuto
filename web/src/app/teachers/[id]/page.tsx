"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import {
  Loader2,
  AlertCircle,
  ShieldCheck,
  ShieldX,
  Heart,
  ArrowLeft,
} from "lucide-react";
import { useAuth } from "@/lib/auth";
import { api, ApiError } from "@/lib/api";
import DashboardHeader from "@/components/dashboard/DashboardHeader";

type TeacherDetail = {
  id: number;
  name: string;
  bio: string | null;
  country: string | null;
  city: string | null;
  teaching_mode: string | null;
  languages: string[];
  years_experience: number | null;
  identity_verified: boolean;
  education_verified: boolean;
  background_check_passed: boolean;
  is_approved: boolean;
  is_shortlisted: boolean;
  subjects: {
    id: number;
    subject: string;
    category: string;
    grade_levels: string[];
    price_per_session_cp: number;
  }[];
};

export default function TeacherProfilePage() {
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
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-8 sm:px-6">
        {user.role === "student" || user.role === "parent" ? (
          <TeacherProfileContent token={token} />
        ) : (
          <div className="rounded-3xl border border-zinc-200 bg-white p-8 text-center">
            <h1 className="text-lg font-bold text-zinc-900">
              This page is for students and parents
            </h1>
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

function TeacherProfileContent({ token }: { token: string }) {
  const params = useParams<{ id: string }>();
  const [teacher, setTeacher] = useState<TeacherDetail | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [shortlisting, setShortlisting] = useState(false);

  useEffect(() => {
    let cancelled = false;

    api
      .get<{ teacher: TeacherDetail }>(`/tutors/${params.id}`, token)
      .then(({ teacher }) => {
        if (!cancelled) setTeacher(teacher);
      })
      .catch((err) => {
        if (cancelled) return;
        setLoadError(
          err instanceof ApiError && err.status === 404
            ? "This teacher profile isn't available."
            : "Couldn't load this profile. Please try again shortly.",
        );
      });

    return () => {
      cancelled = true;
    };
  }, [params.id, token]);

  async function toggleShortlist() {
    if (!teacher) return;
    setShortlisting(true);
    try {
      if (teacher.is_shortlisted) {
        await api.delete(`/tutors/${teacher.id}/shortlist`, token);
      } else {
        await api.post(`/tutors/${teacher.id}/shortlist`, undefined, token);
      }
      setTeacher({ ...teacher, is_shortlisted: !teacher.is_shortlisted });
    } catch {
      // Best-effort — button simply won't reflect the toggle if this fails.
    } finally {
      setShortlisting(false);
    }
  }

  if (loadError) {
    return (
      <div className="mx-auto mt-10 flex max-w-md items-start gap-2 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
        <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
        {loadError}
      </div>
    );
  }

  if (!teacher) {
    return (
      <div className="flex justify-center py-24">
        <Loader2 className="h-6 w-6 animate-spin text-zinc-400" />
      </div>
    );
  }

  const checks: { label: string; passed: boolean }[] = [
    { label: "Identity verified", passed: teacher.identity_verified },
    { label: "Education verified", passed: teacher.education_verified },
    { label: "Background check passed", passed: teacher.background_check_passed },
  ];

  return (
    <div className="space-y-6">
      <Link
        href="/find-a-tutor"
        className="flex items-center gap-1.5 text-sm font-medium text-zinc-500 hover:text-zinc-700"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to search
      </Link>

      <div className="rounded-3xl border border-zinc-200 bg-white p-6 sm:p-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-zinc-900">{teacher.name}</h1>
              {teacher.is_approved && (
                <span className="flex items-center gap-1 rounded-full bg-brand-blue/10 px-2 py-0.5 text-xs font-medium text-brand-blue">
                  <ShieldCheck className="h-3.5 w-3.5" />
                  Verified
                </span>
              )}
            </div>
            <p className="mt-1 text-sm text-zinc-500">
              {[teacher.city, teacher.country].filter(Boolean).join(", ") || "Location not set"}
              {teacher.years_experience !== null && ` · ${teacher.years_experience} years experience`}
            </p>
            {teacher.languages.length > 0 && (
              <p className="mt-1 text-sm text-zinc-500">Teaches in {teacher.languages.join(", ")}</p>
            )}
          </div>
          <button
            type="button"
            disabled={shortlisting}
            onClick={toggleShortlist}
            className={`flex items-center gap-1.5 rounded-full border px-4 py-2 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${
              teacher.is_shortlisted
                ? "border-brand-pink/30 bg-brand-pink/5 text-brand-pink"
                : "border-zinc-200 text-zinc-700 hover:border-zinc-300 hover:bg-zinc-50"
            }`}
          >
            <Heart className={`h-3.5 w-3.5 ${teacher.is_shortlisted ? "fill-brand-pink" : ""}`} />
            {teacher.is_shortlisted ? "Shortlisted" : "Save to Shortlist"}
          </button>
        </div>

        {teacher.bio && <p className="mt-4 text-sm leading-6 text-zinc-600">{teacher.bio}</p>}

        <div className="mt-6 grid gap-2 sm:grid-cols-3">
          {checks.map((check) => (
            <div
              key={check.label}
              className={`flex items-center gap-2 rounded-xl border px-3.5 py-2.5 text-sm ${
                check.passed
                  ? "border-brand-green/30 bg-brand-green/5 text-brand-green-dark"
                  : "border-zinc-200 bg-zinc-50 text-zinc-500"
              }`}
            >
              {check.passed ? (
                <ShieldCheck className="h-4 w-4 shrink-0" />
              ) : (
                <ShieldX className="h-4 w-4 shrink-0" />
              )}
              {check.label}
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-3xl border border-zinc-200 bg-white p-6 sm:p-8">
        <h2 className="text-base font-bold text-zinc-900">Subjects</h2>
        <div className="mt-4 space-y-3">
          {teacher.subjects.map((subject) => (
            <div
              key={subject.id}
              className="flex flex-col gap-1 rounded-2xl border border-zinc-200 p-4 sm:flex-row sm:items-center sm:justify-between"
            >
              <div>
                <p className="text-sm font-semibold text-zinc-900">
                  {subject.subject}{" "}
                  <span className="font-normal text-zinc-400">· {subject.category}</span>
                </p>
                <p className="mt-0.5 text-xs text-zinc-500">{subject.grade_levels.join(", ")}</p>
              </div>
              <p className="text-sm font-medium text-brand-blue">
                {subject.price_per_session_cp} CP / session
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
