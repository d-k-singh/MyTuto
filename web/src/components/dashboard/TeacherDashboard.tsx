"use client";

import { useEffect, useState } from "react";
import { Loader2, AlertCircle, CheckCircle2, ShieldCheck, ShieldX, Clock } from "lucide-react";
import { api, ApiError } from "@/lib/api";
import { toDateInputValue } from "@/lib/date";

type TeacherProfile = {
  id: number;
  display_name: string | null;
  bio: string | null;
  date_of_birth: string | null;
  gender: string | null;
  country: string | null;
  city: string | null;
  teaching_mode: "online" | "in_person" | "hybrid" | null;
  years_experience: number | null;
  identity_verified: boolean;
  education_verified: boolean;
  background_check_passed: boolean;
  is_approved: boolean;
  completion_percentage: number;
};

const GENDER_OPTIONS = ["Female", "Male", "Non-binary", "Prefer not to say"];
const TEACHING_MODE_OPTIONS: { value: NonNullable<TeacherProfile["teaching_mode"]>; label: string }[] = [
  { value: "online", label: "Online" },
  { value: "in_person", label: "In person" },
  { value: "hybrid", label: "Hybrid" },
];

function inputClass(hasError: boolean) {
  return `w-full rounded-xl border px-3.5 py-2.5 text-sm outline-none placeholder:text-zinc-400 focus:ring-2 ${
    hasError
      ? "border-red-400 focus:border-red-400 focus:ring-red-100"
      : "border-zinc-300 focus:border-brand-blue focus:ring-brand-blue/15"
  }`;
}

export default function TeacherDashboard({ token }: { token: string }) {
  const [profile, setProfile] = useState<TeacherProfile | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    api
      .get<{ profile: TeacherProfile }>("/teacher/profile", token)
      .then(({ profile }) => {
        if (!cancelled) setProfile(profile);
      })
      .catch(() => {
        if (!cancelled) setLoadError("Couldn't load your profile. Please try again shortly.");
      });

    return () => {
      cancelled = true;
    };
  }, [token]);

  if (loadError) {
    return (
      <div className="mx-auto mt-10 flex max-w-md items-start gap-2 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
        <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
        {loadError}
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="flex justify-center py-24">
        <Loader2 className="h-6 w-6 animate-spin text-zinc-400" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <WelcomeCard profile={profile} />
      <VerificationCard profile={profile} />
      <ProfileCard profile={profile} token={token} onSaved={setProfile} />
    </div>
  );
}

function WelcomeCard({ profile }: { profile: TeacherProfile }) {
  return (
    <div className="rounded-3xl border border-zinc-200 bg-white p-6 sm:p-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-zinc-900">
            Welcome back{profile.display_name ? `, ${profile.display_name}` : ""}
          </h1>
          <p className="mt-1 text-sm text-zinc-500">This is your MyTuto teacher dashboard.</p>
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

function VerificationCard({ profile }: { profile: TeacherProfile }) {
  const checks: { label: string; passed: boolean }[] = [
    { label: "Identity verified", passed: profile.identity_verified },
    { label: "Education verified", passed: profile.education_verified },
    { label: "Background check passed", passed: profile.background_check_passed },
  ];

  return (
    <div className="rounded-3xl border border-zinc-200 bg-white p-6 sm:p-8">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-bold text-zinc-900">Verification status</h2>
        {profile.is_approved ? (
          <span className="flex items-center gap-1.5 rounded-full bg-brand-green/10 px-3 py-1 text-xs font-semibold text-brand-green-dark">
            <ShieldCheck className="h-3.5 w-3.5" />
            Approved
          </span>
        ) : (
          <span className="flex items-center gap-1.5 rounded-full bg-brand-orange/10 px-3 py-1 text-xs font-semibold text-brand-orange-dark">
            <Clock className="h-3.5 w-3.5" />
            Under review
          </span>
        )}
      </div>
      <p className="mt-1 text-sm text-zinc-500">
        {profile.is_approved
          ? "Your profile has been approved and is visible to students."
          : "Our team reviews new teacher profiles before they go live. Complete your profile below to speed things up."}
      </p>

      <div className="mt-4 grid gap-2 sm:grid-cols-3">
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
  );
}

function ProfileCard({
  profile,
  token,
  onSaved,
}: {
  profile: TeacherProfile;
  token: string;
  onSaved: (profile: TeacherProfile) => void;
}) {
  const [displayName, setDisplayName] = useState(profile.display_name ?? "");
  const [bio, setBio] = useState(profile.bio ?? "");
  const [dateOfBirth, setDateOfBirth] = useState(toDateInputValue(profile.date_of_birth));
  const [gender, setGender] = useState(profile.gender ?? "");
  const [country, setCountry] = useState(profile.country ?? "");
  const [city, setCity] = useState(profile.city ?? "");
  const [teachingMode, setTeachingMode] = useState<
    NonNullable<TeacherProfile["teaching_mode"]> | ""
  >(profile.teaching_mode ?? "");
  const [yearsExperience, setYearsExperience] = useState(
    profile.years_experience !== null ? String(profile.years_experience) : "",
  );

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
      const { profile: updated } = await api.put<{ profile: TeacherProfile }>(
        "/teacher/profile",
        {
          display_name: displayName || null,
          bio: bio || null,
          date_of_birth: dateOfBirth || null,
          gender: gender || null,
          country: country || null,
          city: city || null,
          teaching_mode: teachingMode || null,
          years_experience: yearsExperience === "" ? null : Number(yearsExperience),
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

  return (
    <div className="rounded-3xl border border-zinc-200 bg-white p-6 sm:p-8">
      <h2 className="text-base font-bold text-zinc-900">Your profile</h2>
      <p className="mt-1 text-sm text-zinc-500">
        This is what students see when they find you.
      </p>

      {formError && (
        <div className="mt-4 flex items-start gap-2 rounded-xl bg-red-50 px-3.5 py-3 text-xs leading-5 text-red-700">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          {formError}
        </div>
      )}

      <form className="mt-6 grid gap-4 sm:grid-cols-2" onSubmit={handleSubmit}>
        <div className="sm:col-span-2">
          <label className="mb-1.5 block text-sm font-medium text-zinc-700">
            Display name
          </label>
          <input
            type="text"
            placeholder="How you'll appear to students"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            className={inputClass(!!fieldErrors.display_name)}
          />
          {fieldErrors.display_name && (
            <p className="mt-1 text-xs text-red-600">{fieldErrors.display_name}</p>
          )}
        </div>

        <div className="sm:col-span-2">
          <label className="mb-1.5 block text-sm font-medium text-zinc-700">Bio</label>
          <textarea
            placeholder="Tell students about your teaching experience and style"
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            maxLength={1000}
            rows={4}
            className={inputClass(!!fieldErrors.bio)}
          />
          {fieldErrors.bio && <p className="mt-1 text-xs text-red-600">{fieldErrors.bio}</p>}
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-zinc-700">
            Date of birth
          </label>
          <input
            type="date"
            value={dateOfBirth}
            onChange={(e) => setDateOfBirth(e.target.value)}
            className={inputClass(!!fieldErrors.date_of_birth)}
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
            className={inputClass(!!fieldErrors.gender)}
          >
            <option value="">Select...</option>
            {GENDER_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-zinc-700">Country</label>
          <input
            type="text"
            placeholder="United States"
            value={country}
            onChange={(e) => setCountry(e.target.value)}
            className={inputClass(!!fieldErrors.country)}
          />
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-zinc-700">City</label>
          <input
            type="text"
            placeholder="Austin"
            value={city}
            onChange={(e) => setCity(e.target.value)}
            className={inputClass(!!fieldErrors.city)}
          />
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-zinc-700">
            Teaching mode
          </label>
          <select
            value={teachingMode}
            onChange={(e) =>
              setTeachingMode(e.target.value as NonNullable<TeacherProfile["teaching_mode"]> | "")
            }
            className={inputClass(!!fieldErrors.teaching_mode)}
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
          <label className="mb-1.5 block text-sm font-medium text-zinc-700">
            Years of experience
          </label>
          <input
            type="number"
            min={0}
            max={80}
            value={yearsExperience}
            onChange={(e) => setYearsExperience(e.target.value)}
            className={inputClass(!!fieldErrors.years_experience)}
          />
          {fieldErrors.years_experience && (
            <p className="mt-1 text-xs text-red-600">{fieldErrors.years_experience}</p>
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
