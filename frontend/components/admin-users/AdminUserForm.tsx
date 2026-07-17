"use client";

import { FormEvent, type ReactNode, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, RefreshCw, Save, ShieldCheck, UserRound } from "lucide-react";
import { toast } from "sonner";

import NameInput from "@/components/form/NameInput";
import PhoneNumberInput from "@/components/form/PhoneNumberInput";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MultiSelect } from "@/components/ui/multi-select";
import { FormPageSkeleton } from "@/components/ui/page-skeletons";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  createAdminUser,
  fetchAdminUser,
  fetchUserOptions,
  updateAdminUser,
} from "@/features/admin-users/admin-user-api";
import { adminUserSchema } from "@/features/admin-users/admin-user-schema";
import type { AdminUserForm as AdminUserFormValues, StaffRole, UserOptions } from "@/features/admin-users/types";
import {
  adminPermissionLabel,
  adminUserRoleLabels,
  adminUserToForm,
  emptyAdminUserForm,
} from "@/features/admin-users/admin-user-utils";
import { generateSecurePassword, zodIssuesToFieldErrors } from "@/features/forms/validation";
import { ApiError } from "@/lib/api";

export default function AdminUserForm({ userId }: { userId?: string }) {
  const router = useRouter();
  const editing = Boolean(userId);
  const [form, setForm] = useState<AdminUserFormValues>(() => ({
    ...emptyAdminUserForm,
    password: editing ? "" : generateSecurePassword(),
  }));
  const [options, setOptions] = useState<UserOptions>({ roles: [], permissions: [] });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [saving, setSaving] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const permissionOptions = useMemo(
    () => options.permissions.map((permission) => ({ label: adminPermissionLabel(permission), value: permission })),
    [options.permissions],
  );

  useEffect(() => {
    const request = userId
      ? Promise.all([fetchUserOptions(), fetchAdminUser(userId)])
      : Promise.all([fetchUserOptions(), Promise.resolve(null)]);

    request
      .then(([nextOptions, user]) => {
        setOptions(nextOptions);
        if (user) setForm(adminUserToForm(user));
      })
      .catch((error) => setLoadError(error instanceof Error ? error.message : "Unable to load the user form."))
      .finally(() => setLoading(false));
  }, [userId]);

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrors({});

    const parsed = adminUserSchema.safeParse(form);
    if (!parsed.success) {
      setErrors(zodIssuesToFieldErrors(parsed.error.issues) as Record<string, string>);
      return;
    }

    if (!editing && !form.password) {
      setErrors({ password: "Password is required." });
      return;
    }

    setConfirmOpen(true);
  }

  async function save() {
    const parsed = adminUserSchema.safeParse(form);
    if (!parsed.success) {
      setConfirmOpen(false);
      setErrors(zodIssuesToFieldErrors(parsed.error.issues) as Record<string, string>);
      return;
    }

    setSaving(true);
    try {
      if (userId) await updateAdminUser(Number(userId), parsed.data as AdminUserFormValues);
      else await createAdminUser(parsed.data as AdminUserFormValues);

      toast.success(editing ? "User updated successfully." : "User created successfully.");
      router.push("/dashboard/users");
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to save user.");
      if (error instanceof ApiError && error.errors) setErrors(flattenErrors(error.errors));
      else setErrors({ form: error instanceof Error ? error.message : "Unable to save user." });
      setConfirmOpen(false);
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <FormPageSkeleton />;

  if (loadError) {
    return (
      <div className="rounded-[1.5rem] border border-destructive/20 bg-white p-6 text-center shadow-sm">
        <p className="text-sm text-destructive">{loadError}</p>
        <Button asChild variant="outline" className="mt-4">
          <Link href="/dashboard/users">Back to users</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <section className="flex flex-col gap-5 rounded-[1.75rem] bg-[#162d4a] p-5 text-white shadow-[0_22px_65px_rgba(22,45,74,0.14)] sm:p-7 md:flex-row md:items-end md:justify-between">
        <div>
          <Link href="/dashboard/users" className="inline-flex items-center gap-1.5 text-xs font-semibold text-white/60 transition-colors hover:text-white">
            <ArrowLeft className="size-3.5" />
            Back to users
          </Link>
          <p className="mt-6 text-[10px] font-bold uppercase tracking-[0.22em] text-[#b9cfe0]">Access control</p>
          <h1 className="mt-2 text-3xl font-medium tracking-[-0.04em] sm:text-4xl">
            {editing ? "Edit user" : "Create user"}
          </h1>
          <p className="mt-2 max-w-xl text-sm leading-6 text-white/55">
            {editing ? "Update account details, role, and direct permission overrides." : "Create an account and define its role and access in one place."}
          </p>
        </div>
        <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.06] px-4 py-3">
          <span className="flex size-10 items-center justify-center rounded-xl bg-white text-[#162d4a]">
            <UserRound className="size-4" />
          </span>
          <div>
            <p className="text-[9px] font-bold uppercase tracking-[0.18em] text-white/40">User record</p>
            <p className="mt-0.5 text-sm font-medium">{editing ? "Existing account" : "New account"}</p>
          </div>
        </div>
      </section>

      <form onSubmit={submit} className="grid gap-5 xl:grid-cols-[minmax(0,1.5fr)_minmax(320px,0.7fr)]">
        <section className="rounded-[1.5rem] border border-[#dce4ea] bg-white p-4 shadow-[0_14px_42px_rgba(22,45,74,0.055)] sm:p-6">
          <div className="mb-5 flex items-center gap-3 border-b border-[#e7edf1] pb-4">
            <span className="flex size-9 items-center justify-center rounded-xl bg-[#edf3f7] text-[#315b7d]">
              <UserRound className="size-4" />
            </span>
            <div>
              <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-[#7e94a7]">Account information</p>
              <h2 className="mt-1 text-base font-semibold text-[#162d4a]">Identity and contact</h2>
            </div>
          </div>

          {errors.form && <p className="mb-4 rounded-xl border border-destructive/20 bg-destructive/10 px-3 py-2 text-sm text-destructive">{errors.form}</p>}

          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Username" error={errors.username}>
              <Input value={form.username} onChange={(event) => setForm({ ...form, username: event.target.value })} className="h-11 rounded-xl" />
            </Field>
            <Field label="Email" error={errors.email}>
              <Input type="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} className="h-11 rounded-xl" />
            </Field>
            <Field label="First Name" error={errors.first_name}>
              <NameInput value={form.first_name} onValueChange={(value) => setForm({ ...form, first_name: value })} />
            </Field>
            <Field label="Last Name" error={errors.last_name}>
              <NameInput value={form.last_name} onValueChange={(value) => setForm({ ...form, last_name: value })} />
            </Field>
            <Field label="Phone" error={errors.phone_number}>
              <PhoneNumberInput value={form.phone_number} onValueChange={(value) => setForm({ ...form, phone_number: value })} />
            </Field>
            <Field label={editing ? "Password (optional)" : "Password"} error={errors.password}>
              <div className="flex gap-2">
                <Input type="text" className="h-11 min-w-0 rounded-xl font-mono" value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} placeholder={editing ? "Keep current password" : "Generated secure password"} />
                <Button type="button" variant="outline" className="size-11 shrink-0 rounded-xl p-0 sm:w-auto sm:px-3" onClick={() => setForm({ ...form, password: generateSecurePassword() })} aria-label="Generate secure password">
                  <RefreshCw className="size-4" />
                  <span className="hidden sm:inline">Generate</span>
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">Use uppercase, lowercase, number, and symbol.</p>
            </Field>
          </div>
        </section>

        <section className="rounded-[1.5rem] border border-[#dce4ea] bg-white p-4 shadow-[0_14px_42px_rgba(22,45,74,0.055)] sm:p-6">
          <div className="mb-5 flex items-center gap-3 border-b border-[#e7edf1] pb-4">
            <span className="flex size-9 items-center justify-center rounded-xl bg-[#edf3f7] text-[#315b7d]">
              <ShieldCheck className="size-4" />
            </span>
            <div>
              <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-[#7e94a7]">Authorization</p>
              <h2 className="mt-1 text-base font-semibold text-[#162d4a]">Role and permissions</h2>
            </div>
          </div>

          <div className="space-y-5">
            <Field label="Role" error={errors.role}>
              <Select value={form.role} onValueChange={(value) => setForm({ ...form, role: value as StaffRole })}>
                <SelectTrigger className="h-11 w-full rounded-xl"><SelectValue placeholder="Select role" /></SelectTrigger>
                <SelectContent>
                  {options.roles.map((role) => <SelectItem key={role} value={role}>{adminUserRoleLabels[role] ?? role}</SelectItem>)}
                </SelectContent>
              </Select>
            </Field>

            <Field label="Permission Overrides" error={errors.permissions}>
              <MultiSelect
                key={`${userId ?? "new"}-${form.permissions.join(".")}`}
                options={permissionOptions}
                defaultValue={form.permissions}
                onValueChange={(permissions) => setForm({ ...form, permissions })}
                placeholder="Add direct permissions"
                maxCount={4}
                animation={0}
              />
            </Field>

            <div className="rounded-xl bg-[#f3f7fa] p-3 text-xs leading-5 text-[#657b8f]">
              Role permissions are inherited automatically. Overrides grant additional access directly to this account.
            </div>
          </div>

          <div className="mt-6 flex flex-col-reverse gap-2 border-t border-[#e7edf1] pt-4 sm:flex-row sm:justify-end">
            <Button asChild type="button" variant="outline" className="rounded-xl">
              <Link href="/dashboard/users">Cancel</Link>
            </Button>
            <Button type="submit" disabled={saving} className="gap-2 rounded-xl">
              <Save className="size-4" />
              {editing ? "Save changes" : "Create user"}
            </Button>
          </div>
        </section>
      </form>

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{editing ? "Save user changes?" : "Create this user?"}</AlertDialogTitle>
            <AlertDialogDescription>
              {editing ? "This will update the account, role, and permission overrides." : "This will create a new account with the selected role and permissions."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={saving}>Review</AlertDialogCancel>
            <AlertDialogAction disabled={saving} onClick={(event) => { event.preventDefault(); void save(); }}>
              {saving ? "Saving..." : editing ? "Save changes" : "Create user"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function Field({ label, error, children }: { label: string; error?: string; children: ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs font-medium text-muted-foreground">{label}</Label>
      {children}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}

function flattenErrors(errors: Record<string, string[] | string>) {
  return Object.fromEntries(Object.entries(errors).map(([key, value]) => [key, Array.isArray(value) ? value[0] : value]));
}
