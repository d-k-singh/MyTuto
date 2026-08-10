"use client";

import { useEffect, useState } from "react";
import {
  Loader2,
  AlertCircle,
  CheckCircle2,
  UserPlus,
  Check,
  X,
  LayoutDashboard,
  UserCircle,
  Users,
  Mail,
} from "lucide-react";
import { api, ApiError } from "@/lib/api";
import { toDateInputValue } from "@/lib/date";
import { inputClass } from "@/lib/ui";
import DashboardShell, { type DashboardSection } from "./DashboardShell";

type ParentProfile = {
  id: number;
  relationship_to_child: "mother" | "father" | "guardian" | "other" | null;
  country: string | null;
  city: string | null;
  credit_spend_limit: string | null;
  completion_percentage: number;
};

type Child = {
  id: number;
  display_name: string;
  date_of_birth: string | null;
  gender: string | null;
  school_name: string | null;
  country: string | null;
  city: string | null;
  learning_goal: string | null;
  is_active: boolean;
  completion_percentage: number;
};

type IncomingConsentRequest = {
  id: number;
  expires_at: string;
  student: { id: number; name: string; email: string };
};

const GENDER_OPTIONS = ["Female", "Male", "Non-binary", "Prefer not to say"];
const RELATIONSHIP_OPTIONS: { value: NonNullable<ParentProfile["relationship_to_child"]>; label: string }[] = [
  { value: "mother", label: "Mother" },
  { value: "father", label: "Father" },
  { value: "guardian", label: "Guardian" },
  { value: "other", label: "Other" },
];

function age(dateOfBirth: string | null): number | null {
  if (!dateOfBirth) return null;
  const dob = new Date(dateOfBirth);
  const diff = Date.now() - dob.getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24 * 365.25));
}

export default function ParentDashboard({ token }: { token: string }) {
  const [activeSection, setActiveSection] = useState("overview");
  const [profile, setProfile] = useState<ParentProfile | null>(null);
  const [children, setChildren] = useState<Child[] | null>(null);
  const [consentRequests, setConsentRequests] = useState<IncomingConsentRequest[] | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const [{ profile }, { children }, { requests }] = await Promise.all([
          api.get<{ profile: ParentProfile }>("/parent/profile", token),
          api.get<{ children: Child[] }>("/parent/children", token),
          api.get<{ requests: IncomingConsentRequest[] }>("/parent/parental-consent-requests", token),
        ]);
        if (cancelled) return;
        setProfile(profile);
        setChildren(children);
        setConsentRequests(requests);
      } catch {
        if (!cancelled) setLoadError("Couldn't load your dashboard. Please try again shortly.");
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

  if (!profile || !children || !consentRequests) {
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
          {consentRequests.length > 0 && (
            <ConsentRequestsCard
              token={token}
              requests={consentRequests}
              onResolved={(id) =>
                setConsentRequests((prev) => (prev ?? []).filter((r) => r.id !== id))
              }
            />
          )}
        </div>
      )}
      {activeSection === "profile" && (
        <ProfileCard profile={profile} token={token} onSaved={setProfile} />
      )}
      {activeSection === "children" && (
        <ChildrenCard
          token={token}
          childProfiles={children}
          onCreated={(child) => setChildren((prev) => [...(prev ?? []), child])}
          onUpdated={(child) =>
            setChildren((prev) => (prev ?? []).map((c) => (c.id === child.id ? child : c)))
          }
        />
      )}
      {activeSection === "consent" &&
        (consentRequests.length > 0 ? (
          <ConsentRequestsCard
            token={token}
            requests={consentRequests}
            onResolved={(id) => setConsentRequests((prev) => (prev ?? []).filter((r) => r.id !== id))}
          />
        ) : (
          <div className="rounded-3xl border border-zinc-200 bg-white p-8 text-center text-sm text-zinc-500">
            No pending consent requests.
          </div>
        ))}
    </DashboardShell>
  );
}

const SECTIONS: DashboardSection[] = [
  { id: "overview", label: "Overview", icon: LayoutDashboard },
  { id: "profile", label: "My Profile", icon: UserCircle },
  { id: "children", label: "My Children", icon: Users },
  { id: "consent", label: "Consent Requests", icon: Mail },
];

function WelcomeCard({ profile }: { profile: ParentProfile }) {
  return (
    <div className="rounded-3xl border border-zinc-200 bg-white p-6 sm:p-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-zinc-900">Welcome back</h1>
          <p className="mt-1 text-sm text-zinc-500">This is your MyTuto parent dashboard.</p>
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

function ConsentRequestsCard({
  token,
  requests,
  onResolved,
}: {
  token: string;
  requests: IncomingConsentRequest[];
  onResolved: (id: number) => void;
}) {
  const [busyId, setBusyId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function respond(id: number, action: "approve" | "decline") {
    setBusyId(id);
    setError(null);
    try {
      await api.post(`/parent/parental-consent-requests/${id}/${action}`, undefined, token);
      onResolved(id);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Something went wrong.");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="rounded-3xl border border-brand-blue/30 bg-brand-blue/5 p-6 sm:p-8">
      <h2 className="text-base font-bold text-zinc-900">Consent requests</h2>
      <p className="mt-1 text-sm text-zinc-500">
        These students entered your email as their parent and are waiting for your approval.
      </p>

      {error && (
        <div className="mt-4 flex items-start gap-2 rounded-xl bg-red-50 px-3.5 py-3 text-xs leading-5 text-red-700">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      <div className="mt-4 space-y-3">
        {requests.map((request) => (
          <div
            key={request.id}
            className="flex flex-col gap-3 rounded-2xl border border-zinc-200 bg-white p-4 sm:flex-row sm:items-center sm:justify-between"
          >
            <div>
              <p className="text-sm font-semibold text-zinc-900">{request.student.name}</p>
              <p className="text-xs text-zinc-500">{request.student.email}</p>
              <p className="mt-1 text-xs text-zinc-400">
                Expires {new Date(request.expires_at).toLocaleDateString()}
              </p>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                disabled={busyId === request.id}
                onClick={() => respond(request.id, "approve")}
                className="flex items-center gap-1.5 rounded-full bg-brand-green px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-brand-green-dark disabled:cursor-not-allowed disabled:opacity-60"
              >
                <Check className="h-4 w-4" />
                Approve
              </button>
              <button
                type="button"
                disabled={busyId === request.id}
                onClick={() => respond(request.id, "decline")}
                className="flex items-center gap-1.5 rounded-full border border-zinc-200 px-4 py-2 text-sm font-medium text-zinc-700 transition-colors hover:border-zinc-300 hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <X className="h-4 w-4" />
                Decline
              </button>
            </div>
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
  profile: ParentProfile;
  token: string;
  onSaved: (profile: ParentProfile) => void;
}) {
  const [relationship, setRelationship] = useState<
    NonNullable<ParentProfile["relationship_to_child"]> | ""
  >(profile.relationship_to_child ?? "");
  const [country, setCountry] = useState(profile.country ?? "");
  const [city, setCity] = useState(profile.city ?? "");
  const [spendLimit, setSpendLimit] = useState(profile.credit_spend_limit ?? "");

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
      const { profile: updated } = await api.put<{ profile: ParentProfile }>(
        "/parent/profile",
        {
          relationship_to_child: relationship || null,
          country: country || null,
          city: city || null,
          credit_spend_limit: spendLimit === "" ? null : Number(spendLimit),
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
      <p className="mt-1 text-sm text-zinc-500">Tell us a bit about yourself.</p>

      {formError && (
        <div className="mt-4 flex items-start gap-2 rounded-xl bg-red-50 px-3.5 py-3 text-xs leading-5 text-red-700">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          {formError}
        </div>
      )}

      <form className="mt-6 grid gap-4 sm:grid-cols-2" onSubmit={handleSubmit}>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-zinc-700">
            Relationship to child
          </label>
          <select
            value={relationship}
            onChange={(e) =>
              setRelationship(e.target.value as NonNullable<ParentProfile["relationship_to_child"]> | "")
            }
            className={inputClass(!!fieldErrors.relationship_to_child)}
          >
            <option value="">Select...</option>
            {RELATIONSHIP_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          {fieldErrors.relationship_to_child && (
            <p className="mt-1 text-xs text-red-600">{fieldErrors.relationship_to_child}</p>
          )}
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-zinc-700">
            Monthly spend limit ($)
          </label>
          <input
            type="number"
            min={0}
            step="0.01"
            placeholder="No limit"
            value={spendLimit}
            onChange={(e) => setSpendLimit(e.target.value)}
            className={inputClass(!!fieldErrors.credit_spend_limit)}
          />
          {fieldErrors.credit_spend_limit && (
            <p className="mt-1 text-xs text-red-600">{fieldErrors.credit_spend_limit}</p>
          )}
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
            className={inputClass(!!fieldErrors.city)}
          />
          {fieldErrors.city && <p className="mt-1 text-xs text-red-600">{fieldErrors.city}</p>}
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

function ChildrenCard({
  token,
  childProfiles,
  onCreated,
  onUpdated,
}: {
  token: string;
  childProfiles: Child[];
  onCreated: (child: Child) => void;
  onUpdated: (child: Child) => void;
}) {
  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  return (
    <div className="rounded-3xl border border-zinc-200 bg-white p-6 sm:p-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-bold text-zinc-900">Your children</h2>
          <p className="mt-1 text-sm text-zinc-500">
            Manage the profiles you&apos;ve created for your kids.
          </p>
        </div>
        {!adding && (
          <button
            type="button"
            onClick={() => setAdding(true)}
            className="flex items-center gap-1.5 rounded-full bg-brand-blue px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-brand-blue-dark"
          >
            <UserPlus className="h-4 w-4" />
            Add child
          </button>
        )}
      </div>

      {adding && (
        <div className="mt-6 rounded-2xl border border-zinc-200 p-4">
          <AddChildForm
            token={token}
            onCreated={(child) => {
              onCreated(child);
              setAdding(false);
            }}
            onCancel={() => setAdding(false)}
          />
        </div>
      )}

      <div className="mt-6 space-y-3">
        {childProfiles.length === 0 && !adding && (
          <p className="text-sm text-zinc-400">You haven&apos;t added any children yet.</p>
        )}
        {childProfiles.map((child) =>
          editingId === child.id ? (
            <div key={child.id} className="rounded-2xl border border-zinc-200 p-4">
              <EditChildForm
                token={token}
                child={child}
                onSaved={(updated) => {
                  onUpdated(updated);
                  setEditingId(null);
                }}
                onCancel={() => setEditingId(null)}
              />
            </div>
          ) : (
            <ChildRow
              key={child.id}
              token={token}
              child={child}
              onEdit={() => setEditingId(child.id)}
              onUpdated={onUpdated}
            />
          ),
        )}
      </div>
    </div>
  );
}

function ChildRow({
  token,
  child,
  onEdit,
  onUpdated,
}: {
  token: string;
  child: Child;
  onEdit: () => void;
  onUpdated: (child: Child) => void;
}) {
  const [toggling, setToggling] = useState(false);
  const childAge = age(child.date_of_birth);

  async function toggleActive() {
    setToggling(true);
    try {
      const { child: updated } = await api.patch<{ child: Child }>(
        `/parent/children/${child.id}/${child.is_active ? "deactivate" : "reactivate"}`,
        undefined,
        token,
      );
      onUpdated(updated);
    } catch {
      // Best-effort — row simply won't reflect the toggle if this fails.
    } finally {
      setToggling(false);
    }
  }

  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-zinc-200 p-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <div className="flex items-center gap-2">
          <p className="text-sm font-semibold text-zinc-900">{child.display_name}</p>
          <span
            className={`rounded-full px-2 py-0.5 text-xs font-medium ${
              child.is_active ? "bg-brand-green/10 text-brand-green-dark" : "bg-zinc-100 text-zinc-500"
            }`}
          >
            {child.is_active ? "Active" : "Inactive"}
          </span>
        </div>
        <p className="mt-0.5 text-xs text-zinc-500">
          {childAge !== null ? `${childAge} years old` : "Age not set"}
          {child.school_name ? ` · ${child.school_name}` : ""}
        </p>
        {child.learning_goal && (
          <p className="mt-1 text-xs text-zinc-400">{child.learning_goal}</p>
        )}
      </div>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={onEdit}
          className="rounded-full border border-zinc-200 px-4 py-2 text-sm font-medium text-zinc-700 transition-colors hover:border-zinc-300 hover:bg-zinc-50"
        >
          Edit
        </button>
        <button
          type="button"
          disabled={toggling}
          onClick={toggleActive}
          className="rounded-full border border-zinc-200 px-4 py-2 text-sm font-medium text-zinc-700 transition-colors hover:border-zinc-300 hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {child.is_active ? "Deactivate" : "Reactivate"}
        </button>
      </div>
    </div>
  );
}

function ChildFormFields({
  fullName,
  setFullName,
  dateOfBirth,
  setDateOfBirth,
  gender,
  setGender,
  schoolName,
  setSchoolName,
  country,
  setCountry,
  city,
  setCity,
  learningGoal,
  setLearningGoal,
  fieldErrors,
  showFullName,
}: {
  fullName: string;
  setFullName: (v: string) => void;
  dateOfBirth: string;
  setDateOfBirth: (v: string) => void;
  gender: string;
  setGender: (v: string) => void;
  schoolName: string;
  setSchoolName: (v: string) => void;
  country: string;
  setCountry: (v: string) => void;
  city: string;
  setCity: (v: string) => void;
  learningGoal: string;
  setLearningGoal: (v: string) => void;
  fieldErrors: Record<string, string>;
  showFullName: boolean;
}) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {showFullName && (
        <div className="sm:col-span-2">
          <label className="mb-1.5 block text-sm font-medium text-zinc-700">Full name</label>
          <input
            type="text"
            placeholder="Jamie Doe"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            required
            className={inputClass(!!fieldErrors.full_name)}
          />
          {fieldErrors.full_name && (
            <p className="mt-1 text-xs text-red-600">{fieldErrors.full_name}</p>
          )}
        </div>
      )}
      <div>
        <label className="mb-1.5 block text-sm font-medium text-zinc-700">Date of birth</label>
        <input
          type="date"
          value={dateOfBirth}
          onChange={(e) => setDateOfBirth(e.target.value)}
          required
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
        <label className="mb-1.5 block text-sm font-medium text-zinc-700">School</label>
        <input
          type="text"
          value={schoolName}
          onChange={(e) => setSchoolName(e.target.value)}
          className={inputClass(!!fieldErrors.school_name)}
        />
      </div>
      <div>
        <label className="mb-1.5 block text-sm font-medium text-zinc-700">Country</label>
        <input
          type="text"
          value={country}
          onChange={(e) => setCountry(e.target.value)}
          className={inputClass(!!fieldErrors.country)}
        />
      </div>
      <div>
        <label className="mb-1.5 block text-sm font-medium text-zinc-700">City</label>
        <input
          type="text"
          value={city}
          onChange={(e) => setCity(e.target.value)}
          className={inputClass(!!fieldErrors.city)}
        />
      </div>
      <div className="sm:col-span-2">
        <label className="mb-1.5 block text-sm font-medium text-zinc-700">Learning goal</label>
        <textarea
          rows={2}
          maxLength={255}
          value={learningGoal}
          onChange={(e) => setLearningGoal(e.target.value)}
          className={inputClass(!!fieldErrors.learning_goal)}
        />
      </div>
    </div>
  );
}

function AddChildForm({
  token,
  onCreated,
  onCancel,
}: {
  token: string;
  onCreated: (child: Child) => void;
  onCancel: () => void;
}) {
  const [fullName, setFullName] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [gender, setGender] = useState("");
  const [schoolName, setSchoolName] = useState("");
  const [country, setCountry] = useState("");
  const [city, setCity] = useState("");
  const [learningGoal, setLearningGoal] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setFieldErrors({});
    setFormError(null);

    try {
      const { child } = await api.post<{ child: Child }>(
        "/parent/children",
        {
          full_name: fullName,
          date_of_birth: dateOfBirth,
          gender: gender || null,
          school_name: schoolName || null,
          country: country || null,
          city: city || null,
          learning_goal: learningGoal || null,
        },
        token,
      );
      onCreated(child);
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
      <h3 className="text-sm font-bold text-zinc-900">Add a child</h3>

      {formError && (
        <div className="mt-3 flex items-start gap-2 rounded-xl bg-red-50 px-3.5 py-3 text-xs leading-5 text-red-700">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          {formError}
        </div>
      )}

      <div className="mt-4">
        <ChildFormFields
          fullName={fullName}
          setFullName={setFullName}
          dateOfBirth={dateOfBirth}
          setDateOfBirth={setDateOfBirth}
          gender={gender}
          setGender={setGender}
          schoolName={schoolName}
          setSchoolName={setSchoolName}
          country={country}
          setCountry={setCountry}
          city={city}
          setCity={setCity}
          learningGoal={learningGoal}
          setLearningGoal={setLearningGoal}
          fieldErrors={fieldErrors}
          showFullName
        />
      </div>

      <div className="mt-4 flex gap-3">
        <button
          type="submit"
          disabled={saving}
          className="flex items-center justify-center gap-2 rounded-xl bg-brand-blue px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-blue-dark disabled:cursor-not-allowed disabled:opacity-60"
        >
          {saving && <Loader2 className="h-4 w-4 animate-spin" />}
          Add child
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

function EditChildForm({
  token,
  child,
  onSaved,
  onCancel,
}: {
  token: string;
  child: Child;
  onSaved: (child: Child) => void;
  onCancel: () => void;
}) {
  const [dateOfBirth, setDateOfBirth] = useState(toDateInputValue(child.date_of_birth));
  const [gender, setGender] = useState(child.gender ?? "");
  const [schoolName, setSchoolName] = useState(child.school_name ?? "");
  const [country, setCountry] = useState(child.country ?? "");
  const [city, setCity] = useState(child.city ?? "");
  const [learningGoal, setLearningGoal] = useState(child.learning_goal ?? "");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setFieldErrors({});
    setFormError(null);

    try {
      const { child: updated } = await api.put<{ child: Child }>(
        `/parent/children/${child.id}`,
        {
          date_of_birth: dateOfBirth,
          gender: gender || null,
          school_name: schoolName || null,
          country: country || null,
          city: city || null,
          learning_goal: learningGoal || null,
        },
        token,
      );
      onSaved(updated);
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
      <h3 className="text-sm font-bold text-zinc-900">Edit {child.display_name}</h3>

      {formError && (
        <div className="mt-3 flex items-start gap-2 rounded-xl bg-red-50 px-3.5 py-3 text-xs leading-5 text-red-700">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          {formError}
        </div>
      )}

      <div className="mt-4">
        <ChildFormFields
          fullName=""
          setFullName={() => {}}
          dateOfBirth={dateOfBirth}
          setDateOfBirth={setDateOfBirth}
          gender={gender}
          setGender={setGender}
          schoolName={schoolName}
          setSchoolName={setSchoolName}
          country={country}
          setCountry={setCountry}
          city={city}
          setCity={setCity}
          learningGoal={learningGoal}
          setLearningGoal={setLearningGoal}
          fieldErrors={fieldErrors}
          showFullName={false}
        />
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
