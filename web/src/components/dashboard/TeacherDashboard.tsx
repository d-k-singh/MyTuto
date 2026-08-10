"use client";

import { useEffect, useState } from "react";
import {
  Loader2,
  AlertCircle,
  CheckCircle2,
  ShieldCheck,
  ShieldX,
  Clock,
  Plus,
  Pencil,
  Trash2,
  LayoutDashboard,
  UserCircle,
  Settings,
  BookOpen,
} from "lucide-react";
import { api, ApiError } from "@/lib/api";
import { toDateInputValue } from "@/lib/date";
import { COMMON_INDIAN_LANGUAGES } from "@/lib/languages";
import { TIME_BLOCKS } from "@/lib/timeBlocks";
import { inputClass } from "@/lib/ui";
import DashboardShell, { type DashboardSection } from "./DashboardShell";

type TeacherProfile = {
  id: number;
  display_name: string | null;
  bio: string | null;
  date_of_birth: string | null;
  gender: string | null;
  country: string | null;
  city: string | null;
  teaching_mode: "online" | "in_person" | "hybrid" | null;
  languages: string[] | null;
  available_time_blocks: string[] | null;
  years_experience: number | null;
  identity_verified: boolean;
  education_verified: boolean;
  background_check_passed: boolean;
  is_approved: boolean;
  completion_percentage: number;
};

type SubjectCategory = { id: number; name: string };

type CatalogSubject = {
  id: number;
  name: string;
  subject_category_id: number;
  grade_levels: string[] | null;
};

type TeacherSubjectOffering = {
  id: number;
  subject_id: number;
  grade_levels: string[];
  price_per_session_cp: number;
  subject: { id: number; name: string; category: { id: number; name: string } };
};

const GENDER_OPTIONS = ["Female", "Male", "Non-binary", "Prefer not to say"];
const TEACHING_MODE_OPTIONS: { value: NonNullable<TeacherProfile["teaching_mode"]>; label: string }[] = [
  { value: "online", label: "Online" },
  { value: "in_person", label: "In person" },
  { value: "hybrid", label: "Hybrid" },
];

export default function TeacherDashboard({ token }: { token: string }) {
  const [activeSection, setActiveSection] = useState("overview");
  const [profile, setProfile] = useState<TeacherProfile | null>(null);
  const [offerings, setOfferings] = useState<TeacherSubjectOffering[] | null>(null);
  const [categories, setCategories] = useState<SubjectCategory[]>([]);
  const [catalogSubjects, setCatalogSubjects] = useState<CatalogSubject[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const [{ profile }, { subjects: offerings }, { categories }, subjectsPage] = await Promise.all([
          api.get<{ profile: TeacherProfile }>("/teacher/profile", token),
          api.get<{ subjects: TeacherSubjectOffering[] }>("/teacher/subjects", token),
          api.get<{ categories: SubjectCategory[] }>("/subject-categories"),
          api.get<{ data: CatalogSubject[] }>("/subjects?per_page=200"),
        ]);
        if (cancelled) return;
        setProfile(profile);
        setOfferings(offerings);
        setCategories(categories);
        setCatalogSubjects(subjectsPage.data);
      } catch {
        if (!cancelled) setLoadError("Couldn't load your profile. Please try again shortly.");
      }
    }

    load();
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

  if (!profile || !offerings) {
    return (
      <div className="flex justify-center py-24">
        <Loader2 className="h-6 w-6 animate-spin text-zinc-400" />
      </div>
    );
  }

  return (
    <DashboardShell sections={SECTIONS} activeSection={activeSection} onSectionChange={setActiveSection}>
      {activeSection === "overview" && (
        <div className="space-y-6">
          <WelcomeCard profile={profile} />
          <VerificationCard profile={profile} />
        </div>
      )}
      {activeSection === "profile" && (
        <ProfileCard profile={profile} token={token} onSaved={setProfile} />
      )}
      {activeSection === "preferences" && (
        <TeachingPreferencesCard profile={profile} token={token} onSaved={setProfile} />
      )}
      {activeSection === "subjects" && (
        <SubjectsCard
          token={token}
          offerings={offerings}
          categories={categories}
          catalogSubjects={catalogSubjects}
          onCreated={(offering) => setOfferings((prev) => [...(prev ?? []), offering])}
          onUpdated={(offering) =>
            setOfferings((prev) => (prev ?? []).map((o) => (o.id === offering.id ? offering : o)))
          }
          onDeleted={(id) => setOfferings((prev) => (prev ?? []).filter((o) => o.id !== id))}
        />
      )}
    </DashboardShell>
  );
}

const SECTIONS: DashboardSection[] = [
  { id: "overview", label: "Overview", icon: LayoutDashboard },
  { id: "profile", label: "My Profile", icon: UserCircle },
  { id: "preferences", label: "Teaching Preferences", icon: Settings },
  { id: "subjects", label: "My Subjects", icon: BookOpen },
];

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

function toggleInArray(list: string[], value: string): string[] {
  return list.includes(value) ? list.filter((v) => v !== value) : [...list, value];
}

function TeachingPreferencesCard({
  profile,
  token,
  onSaved,
}: {
  profile: TeacherProfile;
  token: string;
  onSaved: (profile: TeacherProfile) => void;
}) {
  const [languages, setLanguages] = useState<string[]>(profile.languages ?? []);
  const [timeBlocks, setTimeBlocks] = useState<string[]>(profile.available_time_blocks ?? []);
  const [formError, setFormError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setFormError(null);
    setSaved(false);

    try {
      const { profile: updated } = await api.put<{ profile: TeacherProfile }>(
        "/teacher/profile",
        { languages, available_time_blocks: timeBlocks },
        token,
      );
      onSaved(updated);
      setSaved(true);
    } catch (err) {
      setFormError(err instanceof ApiError ? err.message : "Something went wrong. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="rounded-3xl border border-zinc-200 bg-white p-6 sm:p-8">
      <h2 className="text-base font-bold text-zinc-900">Teaching preferences</h2>
      <p className="mt-1 text-sm text-zinc-500">
        These feed the matching engine that connects you with students.
      </p>

      {formError && (
        <div className="mt-4 flex items-start gap-2 rounded-xl bg-red-50 px-3.5 py-3 text-xs leading-5 text-red-700">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          {formError}
        </div>
      )}

      <form className="mt-6 space-y-6" onSubmit={handleSubmit}>
        <div>
          <label className="mb-2 block text-sm font-medium text-zinc-700">
            Languages you teach in
          </label>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {COMMON_INDIAN_LANGUAGES.map((language) => (
              <label
                key={language}
                className="flex items-center gap-2 rounded-xl border border-zinc-200 px-3 py-2 text-sm text-zinc-700"
              >
                <input
                  type="checkbox"
                  checked={languages.includes(language)}
                  onChange={() => setLanguages((prev) => toggleInArray(prev, language))}
                  className="h-4 w-4 rounded border-zinc-300 text-brand-blue focus:ring-brand-blue/30"
                />
                {language}
              </label>
            ))}
          </div>
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-zinc-700">
            Times you&apos;re available
          </label>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {TIME_BLOCKS.map((block) => (
              <label
                key={block.value}
                className="flex items-center gap-2 rounded-xl border border-zinc-200 px-3 py-2 text-sm text-zinc-700"
              >
                <input
                  type="checkbox"
                  checked={timeBlocks.includes(block.value)}
                  onChange={() => setTimeBlocks((prev) => toggleInArray(prev, block.value))}
                  className="h-4 w-4 rounded border-zinc-300 text-brand-blue focus:ring-brand-blue/30"
                />
                {block.label}
              </label>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-3">
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

function SubjectsCard({
  token,
  offerings,
  categories,
  catalogSubjects,
  onCreated,
  onUpdated,
  onDeleted,
}: {
  token: string;
  offerings: TeacherSubjectOffering[];
  categories: SubjectCategory[];
  catalogSubjects: CatalogSubject[];
  onCreated: (offering: TeacherSubjectOffering) => void;
  onUpdated: (offering: TeacherSubjectOffering) => void;
  onDeleted: (id: number) => void;
}) {
  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  return (
    <div className="rounded-3xl border border-zinc-200 bg-white p-6 sm:p-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-bold text-zinc-900">Subjects you teach</h2>
          <p className="mt-1 text-sm text-zinc-500">
            Grade levels and pricing per subject, used to match you with students.
          </p>
        </div>
        {!adding && (
          <button
            type="button"
            onClick={() => setAdding(true)}
            className="flex items-center gap-1.5 rounded-full bg-brand-blue px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-brand-blue-dark"
          >
            <Plus className="h-4 w-4" />
            Add subject
          </button>
        )}
      </div>

      {adding && (
        <div className="mt-6 rounded-2xl border border-zinc-200 p-4">
          <AddSubjectForm
            token={token}
            categories={categories}
            catalogSubjects={catalogSubjects}
            existingSubjectIds={offerings.map((o) => o.subject_id)}
            onCreated={(offering) => {
              onCreated(offering);
              setAdding(false);
            }}
            onCancel={() => setAdding(false)}
          />
        </div>
      )}

      <div className="mt-6 space-y-3">
        {offerings.length === 0 && !adding && (
          <p className="text-sm text-zinc-400">You haven&apos;t added any subjects yet.</p>
        )}
        {offerings.map((offering) =>
          editingId === offering.id ? (
            <div key={offering.id} className="rounded-2xl border border-zinc-200 p-4">
              <EditSubjectForm
                token={token}
                offering={offering}
                onSaved={(updated) => {
                  onUpdated(updated);
                  setEditingId(null);
                }}
                onCancel={() => setEditingId(null)}
              />
            </div>
          ) : (
            <SubjectRow
              key={offering.id}
              token={token}
              offering={offering}
              onEdit={() => setEditingId(offering.id)}
              onDeleted={onDeleted}
            />
          ),
        )}
      </div>
    </div>
  );
}

function SubjectRow({
  token,
  offering,
  onEdit,
  onDeleted,
}: {
  token: string;
  offering: TeacherSubjectOffering;
  onEdit: () => void;
  onDeleted: (id: number) => void;
}) {
  const [deleting, setDeleting] = useState(false);

  async function handleDelete() {
    setDeleting(true);
    try {
      await api.delete(`/teacher/subjects/${offering.id}`, token);
      onDeleted(offering.id);
    } catch {
      setDeleting(false);
    }
  }

  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-zinc-200 p-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <p className="text-sm font-semibold text-zinc-900">
          {offering.subject.name}{" "}
          <span className="font-normal text-zinc-400">· {offering.subject.category.name}</span>
        </p>
        <p className="mt-0.5 text-xs text-zinc-500">{offering.grade_levels.join(", ")}</p>
        <p className="mt-1 text-xs font-medium text-brand-blue">
          {offering.price_per_session_cp} CP / session
        </p>
      </div>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={onEdit}
          className="flex items-center gap-1.5 rounded-full border border-zinc-200 px-4 py-2 text-sm font-medium text-zinc-700 transition-colors hover:border-zinc-300 hover:bg-zinc-50"
        >
          <Pencil className="h-3.5 w-3.5" />
          Edit
        </button>
        <button
          type="button"
          disabled={deleting}
          onClick={handleDelete}
          className="flex items-center gap-1.5 rounded-full border border-zinc-200 px-4 py-2 text-sm font-medium text-zinc-700 transition-colors hover:border-zinc-300 hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <Trash2 className="h-3.5 w-3.5" />
          Remove
        </button>
      </div>
    </div>
  );
}

function AddSubjectForm({
  token,
  categories,
  catalogSubjects,
  existingSubjectIds,
  onCreated,
  onCancel,
}: {
  token: string;
  categories: SubjectCategory[];
  catalogSubjects: CatalogSubject[];
  existingSubjectIds: number[];
  onCreated: (offering: TeacherSubjectOffering) => void;
  onCancel: () => void;
}) {
  const availableSubjects = catalogSubjects.filter((s) => !existingSubjectIds.includes(s.id));

  const [subjectId, setSubjectId] = useState("");
  const [selectedGradeLevels, setSelectedGradeLevels] = useState<string[]>([]);
  const [customGradeLevels, setCustomGradeLevels] = useState("");
  const [price, setPrice] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const selectedSubject = catalogSubjects.find((s) => s.id === Number(subjectId));
  const gradeLevelOptions = selectedSubject?.grade_levels ?? [];

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setFieldErrors({});
    setFormError(null);

    const gradeLevels =
      gradeLevelOptions.length > 0
        ? selectedGradeLevels
        : customGradeLevels
            .split(",")
            .map((level) => level.trim())
            .filter(Boolean);

    try {
      const { subject } = await api.post<{ subject: TeacherSubjectOffering }>(
        "/teacher/subjects",
        {
          subject_id: Number(subjectId),
          grade_levels: gradeLevels,
          price_per_session_cp: Number(price),
        },
        token,
      );
      onCreated(subject);
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
    <form onSubmit={handleSubmit}>
      <h3 className="text-sm font-bold text-zinc-900">Add a subject</h3>

      {formError && (
        <div className="mt-3 flex items-start gap-2 rounded-xl bg-red-50 px-3.5 py-3 text-xs leading-5 text-red-700">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          {formError}
        </div>
      )}

      <div className="mt-4 space-y-4">
        <div>
          <label className="mb-1.5 block text-sm font-medium text-zinc-700">Subject</label>
          <select
            value={subjectId}
            onChange={(e) => {
              setSubjectId(e.target.value);
              setSelectedGradeLevels([]);
            }}
            required
            className={inputClass(!!fieldErrors.subject_id)}
          >
            <option value="">Select...</option>
            {categories.map((category) => {
              const options = availableSubjects.filter((s) => s.subject_category_id === category.id);
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
          {fieldErrors.subject_id && (
            <p className="mt-1 text-xs text-red-600">{fieldErrors.subject_id}</p>
          )}
        </div>

        {subjectId && (
          <div>
            <label className="mb-1.5 block text-sm font-medium text-zinc-700">
              Grade levels you teach this at
            </label>
            {gradeLevelOptions.length > 0 ? (
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {gradeLevelOptions.map((level) => (
                  <label
                    key={level}
                    className="flex items-center gap-2 rounded-xl border border-zinc-200 px-3 py-2 text-sm text-zinc-700"
                  >
                    <input
                      type="checkbox"
                      checked={selectedGradeLevels.includes(level)}
                      onChange={() => setSelectedGradeLevels((prev) => toggleInArray(prev, level))}
                      className="h-4 w-4 rounded border-zinc-300 text-brand-blue focus:ring-brand-blue/30"
                    />
                    {level}
                  </label>
                ))}
              </div>
            ) : (
              <input
                type="text"
                placeholder="e.g. Grade 9, Grade 10 (comma separated)"
                value={customGradeLevels}
                onChange={(e) => setCustomGradeLevels(e.target.value)}
                className={inputClass(!!fieldErrors.grade_levels)}
              />
            )}
            {fieldErrors.grade_levels && (
              <p className="mt-1 text-xs text-red-600">{fieldErrors.grade_levels}</p>
            )}
          </div>
        )}

        <div>
          <label className="mb-1.5 block text-sm font-medium text-zinc-700">
            Price per session (CP)
          </label>
          <input
            type="number"
            min={1}
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            required
            className={inputClass(!!fieldErrors.price_per_session_cp)}
          />
          {fieldErrors.price_per_session_cp && (
            <p className="mt-1 text-xs text-red-600">{fieldErrors.price_per_session_cp}</p>
          )}
        </div>
      </div>

      <div className="mt-4 flex gap-3">
        <button
          type="submit"
          disabled={saving}
          className="flex items-center justify-center gap-2 rounded-xl bg-brand-blue px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-blue-dark disabled:cursor-not-allowed disabled:opacity-60"
        >
          {saving && <Loader2 className="h-4 w-4 animate-spin" />}
          Add subject
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="rounded-xl border border-zinc-200 px-5 py-2.5 text-sm font-medium text-zinc-700 hover:border-zinc-300 hover:bg-zinc-50"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}

function EditSubjectForm({
  token,
  offering,
  onSaved,
  onCancel,
}: {
  token: string;
  offering: TeacherSubjectOffering;
  onSaved: (offering: TeacherSubjectOffering) => void;
  onCancel: () => void;
}) {
  const [price, setPrice] = useState(String(offering.price_per_session_cp));
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setFieldErrors({});
    setFormError(null);

    try {
      const { subject } = await api.put<{ subject: TeacherSubjectOffering }>(
        `/teacher/subjects/${offering.id}`,
        { price_per_session_cp: Number(price) },
        token,
      );
      onSaved(subject);
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
    <form onSubmit={handleSubmit}>
      <h3 className="text-sm font-bold text-zinc-900">
        Edit {offering.subject.name}
      </h3>

      {formError && (
        <div className="mt-3 flex items-start gap-2 rounded-xl bg-red-50 px-3.5 py-3 text-xs leading-5 text-red-700">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          {formError}
        </div>
      )}

      <div className="mt-4">
        <label className="mb-1.5 block text-sm font-medium text-zinc-700">
          Price per session (CP)
        </label>
        <input
          type="number"
          min={1}
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          required
          className={inputClass(!!fieldErrors.price_per_session_cp)}
        />
        {fieldErrors.price_per_session_cp && (
          <p className="mt-1 text-xs text-red-600">{fieldErrors.price_per_session_cp}</p>
        )}
      </div>

      <div className="mt-4 flex gap-3">
        <button
          type="submit"
          disabled={saving}
          className="flex items-center justify-center gap-2 rounded-xl bg-brand-blue px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-blue-dark disabled:cursor-not-allowed disabled:opacity-60"
        >
          {saving && <Loader2 className="h-4 w-4 animate-spin" />}
          Save changes
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="rounded-xl border border-zinc-200 px-5 py-2.5 text-sm font-medium text-zinc-700 hover:border-zinc-300 hover:bg-zinc-50"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
