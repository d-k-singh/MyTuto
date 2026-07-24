"use client";

import { useEffect, useState } from "react";
import { Loader2, AlertCircle, CheckCircle2, Clock, XCircle } from "lucide-react";
import { api, ApiError } from "@/lib/api";

type StudentProfile = {
  id: number;
  full_name: string | null;
  display_name: string;
  date_of_birth: string | null;
  gender: string | null;
  country: string | null;
  city: string | null;
  learning_goal: string | null;
  school_name: string | null;
  parental_consent_given: boolean;
  completion_percentage: number;
  is_minor: boolean | null;
};

type ConsentRequest = {
  id: number;
  parent_email: string;
  status: "pending" | "approved" | "declined";
  expires_at: string;
  created_at: string;
};

const GENDER_OPTIONS = ["Female", "Male", "Non-binary", "Prefer not to say"];

export default function StudentDashboard({ token }: { token: string }) {
  const [profile, setProfile] = useState<StudentProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const { profile } = await api.get<{ profile: StudentProfile }>(
          "/student/profile",
          token,
        );
        if (!cancelled) setProfile(profile);
      } catch {
        if (!cancelled) setLoadError("Couldn't load your profile. Please try again shortly.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [token]);

  if (loading) {
    return (
      <div className="flex justify-center py-24">
        <Loader2 className="h-6 w-6 animate-spin text-zinc-400" />
      </div>
    );
  }

  if (loadError || !profile) {
    return (
      <div className="mx-auto mt-10 flex max-w-md items-start gap-2 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
        <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
        {loadError ?? "Something went wrong."}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <WelcomeCard profile={profile} />
      <ProfileCard profile={profile} token={token} onSaved={setProfile} />
      {profile.is_minor === true && !profile.parental_consent_given && (
        <ParentalConsentCard token={token} />
      )}
    </div>
  );
}

function WelcomeCard({ profile }: { profile: StudentProfile }) {
  return (
    <div className="rounded-3xl border border-zinc-200 bg-white p-6 sm:p-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-zinc-900">
            Welcome back, {profile.display_name}
          </h1>
          <p className="mt-1 text-sm text-zinc-500">
            This is your MyTuto student dashboard.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="h-2 w-32 overflow-hidden rounded-full bg-zinc-100">
            <div
              className="h-full rounded-full bg-brand-blue transition-all"
              style={{ width: `${profile.completion_percentage}%` }}
            />
          </div>
          <span className="text-xs font-medium text-zinc-500">
            {profile.completion_percentage}% complete
          </span>
        </div>
      </div>
    </div>
  );
}

function ProfileCard({
  profile,
  token,
  onSaved,
}: {
  profile: StudentProfile;
  token: string;
  onSaved: (profile: StudentProfile) => void;
}) {
  const [dateOfBirth, setDateOfBirth] = useState(profile.date_of_birth ?? "");
  const [gender, setGender] = useState(profile.gender ?? "");
  const [country, setCountry] = useState(profile.country ?? "");
  const [city, setCity] = useState(profile.city ?? "");
  const [learningGoal, setLearningGoal] = useState(profile.learning_goal ?? "");

  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setFieldErrors({});
    setFormError(null);
    setSaved(false);

    try {
      const { profile: updated } = await api.put<{ profile: StudentProfile }>(
        "/student/profile",
        {
          date_of_birth: dateOfBirth || null,
          gender: gender || null,
          country: country || null,
          city: city || null,
          learning_goal: learningGoal || null,
        },
        token,
      );
      onSaved(updated);
      setSaved(true);
    } catch (err) {
      if (err instanceof ApiError) {
        const next: Record<string, string> = {};
        for (const [field, messages] of Object.entries(err.errors)) {
          next[field] = messages[0];
        }
        setFieldErrors(next);
        if (Object.keys(next).length === 0) setFormError(err.message);
      } else {
        setFormError("Something went wrong. Please try again.");
      }
    } finally {
      setSaving(false);
    }
  }

  const inputClass = (field: string) =>
    `w-full rounded-xl border px-3.5 py-2.5 text-sm outline-none placeholder:text-zinc-400 focus:ring-2 ${
      fieldErrors[field]
        ? "border-red-400 focus:border-red-400 focus:ring-red-100"
        : "border-zinc-300 focus:border-brand-blue focus:ring-brand-blue/15"
    }`;

  return (
    <div className="rounded-3xl border border-zinc-200 bg-white p-6 sm:p-8">
      <h2 className="text-base font-bold text-zinc-900">Your profile</h2>
      <p className="mt-1 text-sm text-zinc-500">
        Fill this in so we can match you with the right tutors.
      </p>

      {formError && (
        <div className="mt-4 flex items-start gap-2 rounded-xl bg-red-50 px-3.5 py-3 text-xs leading-5 text-red-700">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          {formError}
        </div>
      )}

      <form className="mt-6 grid gap-4 sm:grid-cols-2" onSubmit={handleSubmit}>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-zinc-700">
            Date of birth
          </label>
          <input
            type="date"
            value={dateOfBirth}
            onChange={(e) => setDateOfBirth(e.target.value)}
            className={inputClass("date_of_birth")}
          />
          {fieldErrors.date_of_birth && (
            <p className="mt-1 text-xs text-red-600">{fieldErrors.date_of_birth}</p>
          )}
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-zinc-700">Gender</label>
          <select
            value={gender}
            onChange={(e) => setGender(e.target.value)}
            className={inputClass("gender")}
          >
            <option value="">Select...</option>
            {GENDER_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
          {fieldErrors.gender && (
            <p className="mt-1 text-xs text-red-600">{fieldErrors.gender}</p>
          )}
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-zinc-700">Country</label>
          <input
            type="text"
            placeholder="United States"
            value={country}
            onChange={(e) => setCountry(e.target.value)}
            className={inputClass("country")}
          />
          {fieldErrors.country && (
            <p className="mt-1 text-xs text-red-600">{fieldErrors.country}</p>
          )}
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-zinc-700">City</label>
          <input
            type="text"
            placeholder="Austin"
            value={city}
            onChange={(e) => setCity(e.target.value)}
            className={inputClass("city")}
          />
          {fieldErrors.city && (
            <p className="mt-1 text-xs text-red-600">{fieldErrors.city}</p>
          )}
        </div>

        <div className="sm:col-span-2">
          <label className="mb-1.5 block text-sm font-medium text-zinc-700">
            Learning goal
          </label>
          <textarea
            placeholder="e.g. Improve my IB Maths grade before finals"
            value={learningGoal}
            onChange={(e) => setLearningGoal(e.target.value)}
            maxLength={255}
            rows={3}
            className={inputClass("learning_goal")}
          />
          {fieldErrors.learning_goal && (
            <p className="mt-1 text-xs text-red-600">{fieldErrors.learning_goal}</p>
          )}
        </div>

        <div className="flex items-center gap-3 sm:col-span-2">
          <button
            type="submit"
            disabled={saving}
            className="flex items-center justify-center gap-2 rounded-xl bg-brand-blue px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-blue-dark disabled:cursor-not-allowed disabled:opacity-60"
          >
            {saving && <Loader2 className="h-4 w-4 animate-spin" />}
            Save changes
          </button>
          {saved && (
            <span className="flex items-center gap-1 text-sm font-medium text-brand-green">
              <CheckCircle2 className="h-4 w-4" />
              Saved
            </span>
          )}
        </div>
      </form>
    </div>
  );
}

function ParentalConsentCard({ token }: { token: string }) {
  const [requests, setRequests] = useState<ConsentRequest[] | null>(null);
  const [parentEmail, setParentEmail] = useState("");
  const [fieldError, setFieldError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let cancelled = false;

    api
      .get<{ requests: ConsentRequest[] }>("/student/parental-consent-requests", token)
      .then(({ requests }) => {
        if (!cancelled) setRequests(requests);
      })
      .catch(() => {
        if (!cancelled) setRequests([]);
      });

    return () => {
      cancelled = true;
    };
  }, [token]);

  async function handleRequestConsent(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setFieldError(null);

    try {
      const { request } = await api.post<{ request: ConsentRequest }>(
        "/student/parental-consent-requests",
        { parent_email: parentEmail },
        token,
      );
      setRequests((prev) => [request, ...(prev ?? [])]);
      setParentEmail("");
    } catch (err) {
      setFieldError(err instanceof ApiError ? err.fieldError("parent_email") ?? err.message : "Something went wrong.");
    } finally {
      setSubmitting(false);
    }
  }

  if (requests === null) {
    return (
      <div className="rounded-3xl border border-zinc-200 bg-white p-6 sm:p-8">
        <Loader2 className="h-5 w-5 animate-spin text-zinc-400" />
      </div>
    );
  }

  const latest = requests[0];
  const isExpired = latest && new Date(latest.expires_at) < new Date();
  const showForm = !latest || latest.status !== "pending" || isExpired;

  return (
    <div className="rounded-3xl border border-zinc-200 bg-white p-6 sm:p-8">
      <h2 className="text-base font-bold text-zinc-900">Parental consent</h2>
      <p className="mt-1 text-sm text-zinc-500">
        Since you&apos;re under 18, a parent or guardian needs to approve your account.
      </p>

      {latest && latest.status === "pending" && !isExpired && (
        <div className="mt-4 flex items-start gap-2 rounded-xl bg-brand-orange/10 px-3.5 py-3 text-sm text-brand-orange-dark">
          <Clock className="mt-0.5 h-4 w-4 shrink-0" />
          Waiting for <span className="font-semibold">{latest.parent_email}</span> to
          approve. This request expires{" "}
          {new Date(latest.expires_at).toLocaleDateString()}.
        </div>
      )}

      {latest && latest.status === "declined" && (
        <div className="mt-4 flex items-start gap-2 rounded-xl bg-red-50 px-3.5 py-3 text-sm text-red-700">
          <XCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <span className="font-semibold">{latest.parent_email}</span> declined this
          request. You can try again with the correct email below.
        </div>
      )}

      {latest && latest.status === "pending" && isExpired && (
        <div className="mt-4 flex items-start gap-2 rounded-xl bg-zinc-50 px-3.5 py-3 text-sm text-zinc-600">
          <Clock className="mt-0.5 h-4 w-4 shrink-0" />
          Your request to <span className="font-semibold">{latest.parent_email}</span>{" "}
          expired without a response. Send a new one below.
        </div>
      )}

      {showForm && (
        <form className="mt-4 flex flex-col gap-3 sm:flex-row" onSubmit={handleRequestConsent}>
          <div className="flex-1">
            <input
              type="email"
              placeholder="parent@example.com"
              value={parentEmail}
              onChange={(e) => setParentEmail(e.target.value)}
              required
              className={`w-full rounded-xl border px-3.5 py-2.5 text-sm outline-none placeholder:text-zinc-400 focus:ring-2 ${
                fieldError
                  ? "border-red-400 focus:border-red-400 focus:ring-red-100"
                  : "border-zinc-300 focus:border-brand-blue focus:ring-brand-blue/15"
              }`}
            />
            {fieldError && <p className="mt-1 text-xs text-red-600">{fieldError}</p>}
          </div>
          <button
            type="submit"
            disabled={submitting}
            className="flex items-center justify-center gap-2 rounded-xl bg-brand-blue px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-blue-dark disabled:cursor-not-allowed disabled:opacity-60"
          >
            {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
            Send request
          </button>
        </form>
      )}
    </div>
  );
}
