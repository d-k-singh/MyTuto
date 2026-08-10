"use client";

import { useEffect, useRef, useState } from "react";
import {
  Loader2,
  AlertCircle,
  ShieldCheck,
  ShieldX,
  ChevronDown,
  ChevronUp,
  Plus,
  Pencil,
  LayoutDashboard,
  Users as UsersIcon,
  BookOpen,
  Clock,
} from "lucide-react";
import { api, ApiError } from "@/lib/api";
import { inputClass } from "@/lib/ui";
import DashboardShell, { type DashboardSection } from "./DashboardShell";

type UserRole = "student" | "parent" | "teacher" | "admin" | "super_admin";

type AdminUser = {
  id: number;
  name: string;
  email: string;
  role: UserRole;
  is_active: boolean;
  created_at: string;
};

type AdminTeacherProfile = {
  id: number;
  display_name: string | null;
  identity_verified: boolean;
  education_verified: boolean;
  background_check_passed: boolean;
  is_approved: boolean;
};

type SubjectCategoryAdmin = {
  id: number;
  name: string;
  is_active: boolean;
  subjects_count: number;
};

type SubjectAdmin = {
  id: number;
  subject_category_id: number;
  name: string;
  description: string | null;
  grade_levels: string[] | null;
  exam_boards: string[] | null;
  countries: string[] | null;
  is_active: boolean;
  category: { id: number; name: string };
};

const ROLE_OPTIONS: { value: UserRole; label: string }[] = [
  { value: "student", label: "Student" },
  { value: "parent", label: "Parent" },
  { value: "teacher", label: "Teacher" },
  { value: "admin", label: "Admin" },
  { value: "super_admin", label: "Super Admin" },
];

const SECTIONS: DashboardSection[] = [
  { id: "overview", label: "Overview", icon: LayoutDashboard },
  { id: "users", label: "Users", icon: UsersIcon },
  { id: "catalog", label: "Subject Catalog", icon: BookOpen },
];

export default function AdminDashboard({ token }: { token: string }) {
  const [activeSection, setActiveSection] = useState("overview");

  return (
    <DashboardShell sections={SECTIONS} activeSection={activeSection} onSectionChange={setActiveSection}>
      {activeSection === "overview" && <OverviewSection token={token} />}
      {activeSection === "users" && <UsersCard token={token} />}
      {activeSection === "catalog" && <SubjectCatalogCard token={token} />}
    </DashboardShell>
  );
}

type AdminStats = {
  total_users: number;
  users_by_role: Record<string, number>;
  pending_teacher_approvals: number;
  total_subjects: number;
};

function OverviewSection({ token }: { token: string }) {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    api
      .get<AdminStats>("/admin/stats", token)
      .then((data) => {
        if (!cancelled) setStats(data);
      })
      .catch(() => {
        if (!cancelled) setError("Couldn't load stats. Please try again shortly.");
      });

    return () => {
      cancelled = true;
    };
  }, [token]);

  if (error) {
    return (
      <div className="flex items-start gap-2 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
        <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
        {error}
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="flex justify-center py-24">
        <Loader2 className="h-6 w-6 animate-spin text-zinc-400" />
      </div>
    );
  }

  const cards = [
    { label: "Total Users", value: stats.total_users },
    { label: "Students", value: stats.users_by_role.student ?? 0 },
    { label: "Parents", value: stats.users_by_role.parent ?? 0 },
    { label: "Teachers", value: stats.users_by_role.teacher ?? 0 },
  ];

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((card) => (
          <div key={card.label} className="rounded-3xl border border-zinc-200 bg-white p-6">
            <p className="text-xs font-semibold uppercase tracking-wide text-zinc-400">{card.label}</p>
            <p className="mt-2 text-3xl font-bold text-zinc-900">{card.value}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div
          className={`flex items-center gap-4 rounded-3xl border p-6 ${
            stats.pending_teacher_approvals > 0
              ? "border-brand-orange/30 bg-brand-orange/5"
              : "border-zinc-200 bg-white"
          }`}
        >
          <div
            className={`flex h-12 w-12 items-center justify-center rounded-full ${
              stats.pending_teacher_approvals > 0 ? "bg-brand-orange/15" : "bg-zinc-100"
            }`}
          >
            <Clock
              className={`h-5 w-5 ${
                stats.pending_teacher_approvals > 0 ? "text-brand-orange-dark" : "text-zinc-400"
              }`}
            />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-zinc-400">
              Pending Teacher Approvals
            </p>
            <p className="mt-1 text-2xl font-bold text-zinc-900">{stats.pending_teacher_approvals}</p>
          </div>
        </div>

        <div className="flex items-center gap-4 rounded-3xl border border-zinc-200 bg-white p-6">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-zinc-100">
            <BookOpen className="h-5 w-5 text-zinc-400" />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-zinc-400">Total Subjects</p>
            <p className="mt-1 text-2xl font-bold text-zinc-900">{stats.total_subjects}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function UsersCard({ token }: { token: string }) {
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [users, setUsers] = useState<AdminUser[] | null>(null);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  // Shared between the initial load and manual searches so an older, slower
  // response can never overwrite a newer one — see the note on handleSearch.
  const latestRequestId = useRef(0);

  function buildQuery() {
    const params = new URLSearchParams({ per_page: "50" });
    if (search) params.set("search", search);
    if (roleFilter) params.set("role", roleFilter);
    if (statusFilter) params.set("is_active", statusFilter === "active" ? "1" : "0");
    return params;
  }

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    setSearching(true);
    setError(null);
    // Submitting again before a prior search resolves must not let that
    // prior (now-stale) response win the race and overwrite these results.
    const requestId = ++latestRequestId.current;
    try {
      const response = await api.get<{ data: AdminUser[] }>(`/admin/users?${buildQuery().toString()}`, token);
      if (requestId !== latestRequestId.current) return;
      setUsers(response.data);
    } catch {
      if (requestId !== latestRequestId.current) return;
      setError("Couldn't load users. Please try again shortly.");
    } finally {
      if (requestId === latestRequestId.current) setSearching(false);
    }
  }

  useEffect(() => {
    const requestId = ++latestRequestId.current;

    api
      .get<{ data: AdminUser[] }>("/admin/users?per_page=50", token)
      .then((response) => {
        if (requestId === latestRequestId.current) setUsers(response.data);
      })
      .catch(() => {
        if (requestId === latestRequestId.current) setError("Couldn't load users. Please try again shortly.");
      });

    return () => {
      latestRequestId.current = -1;
    };
  }, [token]);

  function updateUser(updated: AdminUser) {
    setUsers((prev) => (prev ?? []).map((u) => (u.id === updated.id ? updated : u)));
  }

  return (
    <div className="rounded-3xl border border-zinc-200 bg-white p-6 sm:p-8">
      <h2 className="text-base font-bold text-zinc-900">Users</h2>
      <p className="mt-1 text-sm text-zinc-500">Search, filter, and manage every account on the platform.</p>

      <form className="mt-4 grid gap-3 sm:grid-cols-4" onSubmit={handleSearch}>
        <input
          type="text"
          placeholder="Search name or email"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className={`sm:col-span-2 ${inputClass()}`}
        />
        <select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)} className={inputClass()}>
          <option value="">All roles</option>
          {ROLE_OPTIONS.map((role) => (
            <option key={role.value} value={role.value}>
              {role.label}
            </option>
          ))}
        </select>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className={inputClass()}>
          <option value="">All statuses</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
        <div className="sm:col-span-4">
          <button
            type="submit"
            disabled={searching}
            className="flex items-center gap-2 rounded-xl bg-brand-blue px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-blue-dark disabled:cursor-not-allowed disabled:opacity-60"
          >
            {searching && <Loader2 className="h-4 w-4 animate-spin" />}
            Search
          </button>
        </div>
      </form>

      {error && (
        <div className="mt-4 flex items-start gap-2 rounded-xl bg-red-50 px-3.5 py-3 text-xs leading-5 text-red-700">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      {users === null ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-5 w-5 animate-spin text-zinc-400" />
        </div>
      ) : (
        <div className="mt-5 space-y-2">
          {users?.length === 0 && <p className="text-sm text-zinc-400">No users match these filters.</p>}
          {users?.map((user) => (
            <UserRow
              key={user.id}
              token={token}
              user={user}
              expanded={expandedId === user.id}
              onToggleExpand={() => setExpandedId(expandedId === user.id ? null : user.id)}
              onUpdated={updateUser}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function UserRow({
  token,
  user,
  expanded,
  onToggleExpand,
  onUpdated,
}: {
  token: string;
  user: AdminUser;
  expanded: boolean;
  onToggleExpand: () => void;
  onUpdated: (user: AdminUser) => void;
}) {
  const [toggling, setToggling] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function toggleActive() {
    setToggling(true);
    setError(null);
    try {
      const { user: updated } = await api.patch<{ user: AdminUser }>(
        `/admin/users/${user.id}/${user.is_active ? "deactivate" : "activate"}`,
        undefined,
        token,
      );
      onUpdated(updated);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Couldn't update this user.");
    } finally {
      setToggling(false);
    }
  }

  return (
    <div className="rounded-2xl border border-zinc-200">
      <div className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <p className="text-sm font-semibold text-zinc-900">{user.name}</p>
            <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-xs font-medium capitalize text-zinc-600">
              {user.role.replace("_", " ")}
            </span>
            <span
              className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                user.is_active ? "bg-brand-green/10 text-brand-green-dark" : "bg-zinc-100 text-zinc-500"
              }`}
            >
              {user.is_active ? "Active" : "Inactive"}
            </span>
          </div>
          <p className="mt-0.5 text-xs text-zinc-500">{user.email}</p>
        </div>
        <div className="flex gap-2">
          {user.role === "teacher" && (
            <button
              type="button"
              onClick={onToggleExpand}
              className="flex items-center gap-1.5 rounded-full border border-zinc-200 px-4 py-2 text-sm font-medium text-zinc-700 transition-colors hover:border-zinc-300 hover:bg-zinc-50"
            >
              Verification
              {expanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
            </button>
          )}
          <button
            type="button"
            disabled={toggling}
            onClick={toggleActive}
            className="rounded-full border border-zinc-200 px-4 py-2 text-sm font-medium text-zinc-700 transition-colors hover:border-zinc-300 hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {user.is_active ? "Deactivate" : "Activate"}
          </button>
        </div>
      </div>
      {error && <p className="px-4 pb-3 text-xs text-red-600">{error}</p>}
      {expanded && (
        <div className="border-t border-zinc-100 p-4">
          <TeacherVerificationPanel token={token} userId={user.id} />
        </div>
      )}
    </div>
  );
}

function TeacherVerificationPanel({ token, userId }: { token: string; userId: number }) {
  const [profile, setProfile] = useState<AdminTeacherProfile | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    api
      .get<{ user: { teacher_profile: AdminTeacherProfile | null } }>(`/admin/users/${userId}`, token)
      .then(({ user }) => {
        if (!cancelled) setProfile(user.teacher_profile);
      })
      .catch(() => {
        if (!cancelled) setLoadError("Couldn't load this teacher's profile.");
      });

    return () => {
      cancelled = true;
    };
  }, [userId, token]);

  async function toggleFlag(field: "identity_verified" | "education_verified" | "background_check_passed") {
    if (!profile) return;
    setBusy(true);
    setActionError(null);
    try {
      const { profile: updated } = await api.patch<{ profile: AdminTeacherProfile }>(
        `/admin/teachers/${profile.id}/verification`,
        { [field]: !profile[field] },
        token,
      );
      setProfile(updated);
    } catch {
      setActionError("Couldn't update verification status.");
    } finally {
      setBusy(false);
    }
  }

  async function setApproval(approve: boolean) {
    if (!profile) return;
    setBusy(true);
    setActionError(null);
    try {
      const { profile: updated } = await api.patch<{ profile: AdminTeacherProfile }>(
        `/admin/teachers/${profile.id}/${approve ? "approve" : "reject"}`,
        undefined,
        token,
      );
      setProfile(updated);
    } catch {
      setActionError("Couldn't update approval status.");
    } finally {
      setBusy(false);
    }
  }

  if (loadError) {
    return <p className="text-sm text-red-600">{loadError}</p>;
  }

  if (!profile) {
    return (
      <div className="flex justify-center py-4">
        <Loader2 className="h-4 w-4 animate-spin text-zinc-400" />
      </div>
    );
  }

  const checks: { field: "identity_verified" | "education_verified" | "background_check_passed"; label: string }[] = [
    { field: "identity_verified", label: "Identity verified" },
    { field: "education_verified", label: "Education verified" },
    { field: "background_check_passed", label: "Background check passed" },
  ];

  return (
    <div>
      {actionError && <p className="mb-3 text-xs text-red-600">{actionError}</p>}
      <div className="grid gap-2 sm:grid-cols-3">
        {checks.map((check) => (
          <button
            key={check.field}
            type="button"
            disabled={busy}
            onClick={() => toggleFlag(check.field)}
            className={`flex items-center gap-2 rounded-xl border px-3.5 py-2.5 text-left text-sm transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${
              profile[check.field]
                ? "border-brand-green/30 bg-brand-green/5 text-brand-green-dark"
                : "border-zinc-200 bg-zinc-50 text-zinc-500"
            }`}
          >
            {profile[check.field] ? (
              <ShieldCheck className="h-4 w-4 shrink-0" />
            ) : (
              <ShieldX className="h-4 w-4 shrink-0" />
            )}
            {check.label}
          </button>
        ))}
      </div>

      <div className="mt-4 flex items-center gap-3">
        <span className="text-sm text-zinc-600">
          Status:{" "}
          <span className={`font-semibold ${profile.is_approved ? "text-brand-green-dark" : "text-brand-orange-dark"}`}>
            {profile.is_approved ? "Approved" : "Under review"}
          </span>
        </span>
        <div className="ml-auto flex gap-2">
          <button
            type="button"
            disabled={busy || profile.is_approved}
            onClick={() => setApproval(true)}
            className="rounded-full bg-brand-green px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-brand-green-dark disabled:cursor-not-allowed disabled:opacity-60"
          >
            Approve
          </button>
          <button
            type="button"
            disabled={busy || !profile.is_approved}
            onClick={() => setApproval(false)}
            className="rounded-full border border-zinc-200 px-4 py-2 text-sm font-medium text-zinc-700 transition-colors hover:border-zinc-300 hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            Reject
          </button>
        </div>
      </div>
    </div>
  );
}

function SubjectCatalogCard({ token }: { token: string }) {
  const [categories, setCategories] = useState<SubjectCategoryAdmin[] | null>(null);
  const [subjects, setSubjects] = useState<SubjectAdmin[] | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [addingCategory, setAddingCategory] = useState(false);
  const [addingSubjectFor, setAddingSubjectFor] = useState<number | null>(null);
  const [editingSubjectId, setEditingSubjectId] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const [{ categories }, subjectsPage] = await Promise.all([
          api.get<{ categories: SubjectCategoryAdmin[] }>("/admin/subject-categories", token),
          api.get<{ data: SubjectAdmin[] }>("/admin/subjects?per_page=100", token),
        ]);
        if (cancelled) return;
        setCategories(categories);
        setSubjects(subjectsPage.data);
      } catch {
        if (!cancelled) setLoadError("Couldn't load the subject catalog.");
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [token]);

  if (loadError) {
    return (
      <div className="rounded-3xl border border-zinc-200 bg-white p-6 sm:p-8">
        <div className="flex items-start gap-2 rounded-xl bg-red-50 px-3.5 py-3 text-sm text-red-700">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          {loadError}
        </div>
      </div>
    );
  }

  if (!categories || !subjects) {
    return (
      <div className="rounded-3xl border border-zinc-200 bg-white p-6 sm:p-8">
        <div className="flex justify-center py-8">
          <Loader2 className="h-5 w-5 animate-spin text-zinc-400" />
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-3xl border border-zinc-200 bg-white p-6 sm:p-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-bold text-zinc-900">Subject catalog</h2>
          <p className="mt-1 text-sm text-zinc-500">Categories and subjects available across the platform.</p>
        </div>
        {!addingCategory && (
          <button
            type="button"
            onClick={() => setAddingCategory(true)}
            className="flex items-center gap-1.5 rounded-full bg-brand-blue px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-brand-blue-dark"
          >
            <Plus className="h-4 w-4" />
            Add category
          </button>
        )}
      </div>

      {addingCategory && (
        <div className="mt-4 rounded-2xl border border-zinc-200 p-4">
          <AddCategoryForm
            token={token}
            onCreated={(category) => {
              setCategories((prev) => [...(prev ?? []), category]);
              setAddingCategory(false);
            }}
            onCancel={() => setAddingCategory(false)}
          />
        </div>
      )}

      <div className="mt-6 space-y-6">
        {categories.map((category) => {
          const categorySubjects = subjects.filter((s) => s.subject_category_id === category.id);
          return (
            <div key={category.id} className="rounded-2xl border border-zinc-200 p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-bold text-zinc-900">{category.name}</p>
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                      category.is_active ? "bg-brand-green/10 text-brand-green-dark" : "bg-zinc-100 text-zinc-500"
                    }`}
                  >
                    {category.is_active ? "Active" : "Inactive"}
                  </span>
                </div>
                <div className="flex gap-2">
                  <CategoryToggleButton
                    token={token}
                    category={category}
                    onUpdated={(updated) =>
                      setCategories((prev) => (prev ?? []).map((c) => (c.id === updated.id ? updated : c)))
                    }
                  />
                  <button
                    type="button"
                    onClick={() => setAddingSubjectFor(addingSubjectFor === category.id ? null : category.id)}
                    className="flex items-center gap-1.5 rounded-full border border-zinc-200 px-3 py-1.5 text-xs font-medium text-zinc-700 transition-colors hover:border-zinc-300 hover:bg-zinc-50"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    Add subject
                  </button>
                </div>
              </div>

              {addingSubjectFor === category.id && (
                <div className="mt-3 rounded-xl border border-zinc-200 p-3">
                  <AddSubjectForm
                    token={token}
                    categoryId={category.id}
                    onCreated={(subject) => {
                      setSubjects((prev) => [...(prev ?? []), subject]);
                      setAddingSubjectFor(null);
                    }}
                    onCancel={() => setAddingSubjectFor(null)}
                  />
                </div>
              )}

              <div className="mt-3 space-y-2">
                {categorySubjects.length === 0 && (
                  <p className="text-xs text-zinc-400">No subjects in this category yet.</p>
                )}
                {categorySubjects.map((subject) =>
                  editingSubjectId === subject.id ? (
                    <div key={subject.id} className="rounded-xl border border-zinc-200 p-3">
                      <EditSubjectForm
                        token={token}
                        subject={subject}
                        onSaved={(updated) => {
                          setSubjects((prev) => (prev ?? []).map((s) => (s.id === updated.id ? updated : s)));
                          setEditingSubjectId(null);
                        }}
                        onCancel={() => setEditingSubjectId(null)}
                      />
                    </div>
                  ) : (
                    <SubjectRow
                      key={subject.id}
                      token={token}
                      subject={subject}
                      onEdit={() => setEditingSubjectId(subject.id)}
                      onUpdated={(updated) =>
                        setSubjects((prev) => (prev ?? []).map((s) => (s.id === updated.id ? updated : s)))
                      }
                    />
                  ),
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function CategoryToggleButton({
  token,
  category,
  onUpdated,
}: {
  token: string;
  category: SubjectCategoryAdmin;
  onUpdated: (category: SubjectCategoryAdmin) => void;
}) {
  const [busy, setBusy] = useState(false);

  async function toggle() {
    setBusy(true);
    try {
      const { category: updated } = await api.patch<{ category: SubjectCategoryAdmin }>(
        `/admin/subject-categories/${category.id}/${category.is_active ? "deactivate" : "activate"}`,
        undefined,
        token,
      );
      onUpdated(updated);
    } catch {
      // Best-effort — row simply won't reflect the toggle if this fails.
    } finally {
      setBusy(false);
    }
  }

  return (
    <button
      type="button"
      disabled={busy}
      onClick={toggle}
      className="rounded-full border border-zinc-200 px-3 py-1.5 text-xs font-medium text-zinc-700 transition-colors hover:border-zinc-300 hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-60"
    >
      {category.is_active ? "Deactivate" : "Activate"}
    </button>
  );
}

function AddCategoryForm({
  token,
  onCreated,
  onCancel,
}: {
  token: string;
  onCreated: (category: SubjectCategoryAdmin) => void;
  onCancel: () => void;
}) {
  const [name, setName] = useState("");
  const [fieldError, setFieldError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setFieldError(null);
    try {
      const { category } = await api.post<{ category: SubjectCategoryAdmin }>(
        "/admin/subject-categories",
        { name },
        token,
      );
      onCreated({ ...category, subjects_count: 0 });
    } catch (err) {
      setFieldError(err instanceof ApiError ? err.fieldError("name") ?? err.message : "Something went wrong.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form className="flex items-end gap-3" onSubmit={handleSubmit}>
      <div className="flex-1">
        <label className="mb-1.5 block text-sm font-medium text-zinc-700">Category name</label>
        <input
          type="text"
          placeholder="e.g. IB Curriculum"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          className={inputClass(!!fieldError)}
        />
        {fieldError && <p className="mt-1 text-xs text-red-600">{fieldError}</p>}
      </div>
      <button
        type="submit"
        disabled={saving}
        className="flex items-center gap-2 rounded-xl bg-brand-blue px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-blue-dark disabled:cursor-not-allowed disabled:opacity-60"
      >
        {saving && <Loader2 className="h-4 w-4 animate-spin" />}
        Add
      </button>
      <button
        type="button"
        onClick={onCancel}
        className="rounded-xl border border-zinc-200 px-5 py-2.5 text-sm font-medium text-zinc-700 hover:border-zinc-300 hover:bg-zinc-50"
      >
        Cancel
      </button>
    </form>
  );
}

function SubjectRow({
  token,
  subject,
  onEdit,
  onUpdated,
}: {
  token: string;
  subject: SubjectAdmin;
  onEdit: () => void;
  onUpdated: (subject: SubjectAdmin) => void;
}) {
  const [busy, setBusy] = useState(false);

  async function toggle() {
    setBusy(true);
    try {
      const { subject: updated } = await api.patch<{ subject: SubjectAdmin }>(
        `/admin/subjects/${subject.id}/${subject.is_active ? "deactivate" : "activate"}`,
        undefined,
        token,
      );
      onUpdated(updated);
    } catch {
      // Best-effort.
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col gap-2 rounded-xl border border-zinc-100 bg-zinc-50/60 p-3 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <div className="flex items-center gap-2">
          <p className="text-sm font-medium text-zinc-900">{subject.name}</p>
          <span
            className={`rounded-full px-2 py-0.5 text-xs font-medium ${
              subject.is_active ? "bg-brand-green/10 text-brand-green-dark" : "bg-zinc-100 text-zinc-500"
            }`}
          >
            {subject.is_active ? "Active" : "Inactive"}
          </span>
        </div>
        {subject.grade_levels && subject.grade_levels.length > 0 && (
          <p className="mt-0.5 text-xs text-zinc-500">{subject.grade_levels.join(", ")}</p>
        )}
      </div>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={onEdit}
          className="flex items-center gap-1.5 rounded-full border border-zinc-200 px-3 py-1.5 text-xs font-medium text-zinc-700 transition-colors hover:border-zinc-300 hover:bg-zinc-50"
        >
          <Pencil className="h-3 w-3" />
          Edit
        </button>
        <button
          type="button"
          disabled={busy}
          onClick={toggle}
          className="rounded-full border border-zinc-200 px-3 py-1.5 text-xs font-medium text-zinc-700 transition-colors hover:border-zinc-300 hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {subject.is_active ? "Deactivate" : "Activate"}
        </button>
      </div>
    </div>
  );
}

function tagsToArray(text: string): string[] {
  return text
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);
}

function AddSubjectForm({
  token,
  categoryId,
  onCreated,
  onCancel,
}: {
  token: string;
  categoryId: number;
  onCreated: (subject: SubjectAdmin) => void;
  onCancel: () => void;
}) {
  const [name, setName] = useState("");
  const [gradeLevels, setGradeLevels] = useState("");
  const [examBoards, setExamBoards] = useState("");
  const [countries, setCountries] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setFieldErrors({});
    setFormError(null);

    try {
      const { subject } = await api.post<{ subject: SubjectAdmin }>(
        "/admin/subjects",
        {
          subject_category_id: categoryId,
          name,
          grade_levels: tagsToArray(gradeLevels),
          exam_boards: tagsToArray(examBoards),
          countries: tagsToArray(countries),
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
      {formError && <p className="mb-2 text-xs text-red-600">{formError}</p>}
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-xs font-medium text-zinc-700">Subject name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className={inputClass(!!fieldErrors.name)}
          />
          {fieldErrors.name && <p className="mt-1 text-xs text-red-600">{fieldErrors.name}</p>}
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-zinc-700">
            Grade levels (comma separated)
          </label>
          <input
            type="text"
            placeholder="Class 1, Class 2, ..."
            value={gradeLevels}
            onChange={(e) => setGradeLevels(e.target.value)}
            className={inputClass()}
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-zinc-700">
            Exam boards (comma separated)
          </label>
          <input
            type="text"
            placeholder="CBSE, IB, ..."
            value={examBoards}
            onChange={(e) => setExamBoards(e.target.value)}
            className={inputClass()}
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-zinc-700">
            Countries (comma separated)
          </label>
          <input
            type="text"
            placeholder="IN, AU, ..."
            value={countries}
            onChange={(e) => setCountries(e.target.value)}
            className={inputClass()}
          />
        </div>
      </div>
      <div className="mt-3 flex gap-2">
        <button
          type="submit"
          disabled={saving}
          className="flex items-center gap-2 rounded-xl bg-brand-blue px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-brand-blue-dark disabled:cursor-not-allowed disabled:opacity-60"
        >
          {saving && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
          Add subject
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="rounded-xl border border-zinc-200 px-4 py-2 text-xs font-medium text-zinc-700 hover:border-zinc-300 hover:bg-zinc-50"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}

function EditSubjectForm({
  token,
  subject,
  onSaved,
  onCancel,
}: {
  token: string;
  subject: SubjectAdmin;
  onSaved: (subject: SubjectAdmin) => void;
  onCancel: () => void;
}) {
  const [name, setName] = useState(subject.name);
  const [gradeLevels, setGradeLevels] = useState((subject.grade_levels ?? []).join(", "));
  const [examBoards, setExamBoards] = useState((subject.exam_boards ?? []).join(", "));
  const [countries, setCountries] = useState((subject.countries ?? []).join(", "));
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setFieldErrors({});
    setFormError(null);

    try {
      const { subject: updated } = await api.put<{ subject: SubjectAdmin }>(
        `/admin/subjects/${subject.id}`,
        {
          name,
          grade_levels: tagsToArray(gradeLevels),
          exam_boards: tagsToArray(examBoards),
          countries: tagsToArray(countries),
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
      {formError && <p className="mb-2 text-xs text-red-600">{formError}</p>}
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-xs font-medium text-zinc-700">Subject name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className={inputClass(!!fieldErrors.name)}
          />
          {fieldErrors.name && <p className="mt-1 text-xs text-red-600">{fieldErrors.name}</p>}
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-zinc-700">
            Grade levels (comma separated)
          </label>
          <input
            type="text"
            value={gradeLevels}
            onChange={(e) => setGradeLevels(e.target.value)}
            className={inputClass()}
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-zinc-700">
            Exam boards (comma separated)
          </label>
          <input
            type="text"
            value={examBoards}
            onChange={(e) => setExamBoards(e.target.value)}
            className={inputClass()}
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-zinc-700">
            Countries (comma separated)
          </label>
          <input
            type="text"
            value={countries}
            onChange={(e) => setCountries(e.target.value)}
            className={inputClass()}
          />
        </div>
      </div>
      <div className="mt-3 flex gap-2">
        <button
          type="submit"
          disabled={saving}
          className="flex items-center gap-2 rounded-xl bg-brand-blue px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-brand-blue-dark disabled:cursor-not-allowed disabled:opacity-60"
        >
          {saving && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
          Save changes
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="rounded-xl border border-zinc-200 px-4 py-2 text-xs font-medium text-zinc-700 hover:border-zinc-300 hover:bg-zinc-50"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
