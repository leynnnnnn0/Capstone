"use client";

import { FormEvent, type ReactNode, useEffect, useMemo, useState } from "react";
import { Edit2, Plus, RefreshCw, RotateCcw, ShieldCheck, SlidersHorizontal, Trash2 } from "lucide-react";
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
import { AdminTableSearch } from "@/components/ui/admin-table-search";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MultiSelect } from "@/components/ui/multi-select";
import { TableSkeletonRows } from "@/components/ui/page-skeletons";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ApiError } from "@/lib/api";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import {
  createAdminUser,
  deleteAdminUser,
  fetchAdminUsers,
  fetchUserOptions,
  updateAdminUser,
} from "@/features/admin-users/admin-user-api";
import { adminUserSchema } from "@/features/admin-users/admin-user-schema";
import type { AdminUser, AdminUserForm, StaffRole, UserCollection, UserOptions } from "@/features/admin-users/types";
import { generateSecurePassword, zodIssuesToFieldErrors } from "@/features/forms/validation";

const emptyForm: AdminUserForm = {
  username: "",
  first_name: "",
  last_name: "",
  email: "",
  phone_number: "",
  password: "",
  role: "worker",
  permissions: [],
};

const roleLabels: Record<StaffRole, string> = {
  admin: "Admin",
  sub_admin: "Sub Admin",
  worker: "Worker",
  customer: "Customer",
};

export default function AdminUsersPage() {
  const [response, setResponse] = useState<UserCollection | null>(null);
  const [options, setOptions] = useState<UserOptions>({ roles: [], permissions: [] });
  const [search, setSearch] = useState("");
  const [role, setRole] = useState("all");
  const [emailStatus, setEmailStatus] = useState("all");
  const [phoneStatus, setPhoneStatus] = useState("all");
  const [twoFactor, setTwoFactor] = useState("all");
  const [createdFrom, setCreatedFrom] = useState("");
  const [createdTo, setCreatedTo] = useState("");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<AdminUser | null>(null);
  const [form, setForm] = useState<AdminUserForm>(emptyForm);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<AdminUser | null>(null);
  const [confirmSaveOpen, setConfirmSaveOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const debouncedSearch = useDebouncedValue(search.trim());
  const userFilters = useMemo(() => ({
    search: debouncedSearch,
    role,
    email_status: emailStatus,
    phone_status: phoneStatus,
    two_factor: twoFactor,
    created_from: createdFrom,
    created_to: createdTo,
  }), [createdFrom, createdTo, debouncedSearch, emailStatus, phoneStatus, role, twoFactor]);
  const hasFilters = Boolean(
    search ||
    role !== "all" ||
    emailStatus !== "all" ||
    phoneStatus !== "all" ||
    twoFactor !== "all" ||
    createdFrom ||
    createdTo,
  );

  const users = response?.data ?? [];
  const permissionOptions = useMemo(
    () => options.permissions.map((permission) => ({ label: permissionLabel(permission), value: permission })),
    [options.permissions],
  );

  useEffect(() => {
    fetchUserOptions().then(setOptions);
  }, []);

  useEffect(() => {
    let active = true;

    fetchAdminUsers(userFilters)
      .then((next) => {
        if (active) setResponse(next);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [userFilters]);

  function openCreate() {
    setEditing(null);
    setForm({ ...emptyForm, password: generateSecurePassword() });
    setErrors({});
    setDialogOpen(true);
  }

  function openEdit(user: AdminUser) {
    setEditing(user);
    setForm({
      username: user.username,
      first_name: user.first_name,
      last_name: user.last_name,
      email: user.email,
      phone_number: user.phone_number ?? "",
      password: "",
      role: user.role,
      permissions: user.permissions ?? [],
    });
    setErrors({});
    setDialogOpen(true);
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
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

    setConfirmSaveOpen(true);
  }

  async function saveUser() {
    const parsed = adminUserSchema.safeParse(form);
    if (!parsed.success) {
      setConfirmSaveOpen(false);
      setErrors(zodIssuesToFieldErrors(parsed.error.issues) as Record<string, string>);
      return;
    }

    setSaving(true);
    try {
      if (editing) await updateAdminUser(editing.id, parsed.data as AdminUserForm);
      else await createAdminUser(parsed.data as AdminUserForm);

      toast.success(editing ? "User updated successfully." : "User created successfully.");
      setConfirmSaveOpen(false);
      setDialogOpen(false);
      setResponse(await fetchAdminUsers(userFilters));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to save user.");
      if (error instanceof ApiError && error.errors) {
        setErrors(flattenErrors(error.errors));
      } else {
        setErrors({ form: error instanceof Error ? error.message : "Unable to save user." });
      }
    } finally {
      setSaving(false);
    }
  }

  async function remove() {
    if (!deleteTarget) return;

    setDeleting(true);
    try {
      await deleteAdminUser(deleteTarget.id);
      toast.success("User deleted successfully.");
      setDeleteTarget(null);
      setResponse(await fetchAdminUsers(userFilters));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to delete user.");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4 rounded-[1.5rem] border border-white/10 bg-[#162d4a] p-5 text-white shadow-[0_18px_55px_rgba(22,45,74,0.12)] sm:p-6 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#b9cfe0]">Access control</p>
          <h1 className="mt-2 text-2xl font-semibold tracking-[-0.035em] text-white">Users</h1>
          <p className="mt-1 text-sm text-white/55">Manage staff, customers, roles, and permission overrides.</p>
        </div>
        <Button onClick={openCreate} size="sm" className="bg-white text-[#162d4a] hover:bg-[#edf3f7]">
          <Plus className="size-4" />
          New User
        </Button>
      </div>

      <div className="rounded-[1.25rem] border border-[#dce4ea] bg-white p-3 shadow-[0_12px_38px_rgba(22,45,74,0.04)]">
        <div className="flex flex-col gap-2 sm:flex-row">
          <AdminTableSearch value={search} onChange={setSearch} placeholder="Search users..." />
          <div className="flex gap-2">
            <Button type="button" variant={filtersOpen ? "secondary" : "outline"} size="sm" onClick={() => setFiltersOpen((value) => !value)} className="h-11 gap-1.5 rounded-xl px-4">
              <SlidersHorizontal className="size-3.5" />
              Filters
            </Button>
            {hasFilters && (
              <Button type="button" variant="ghost" size="sm" onClick={() => {
                setSearch("");
                setRole("all");
                setEmailStatus("all");
                setPhoneStatus("all");
                setTwoFactor("all");
                setCreatedFrom("");
                setCreatedTo("");
              }} className="h-11 gap-1.5 rounded-xl px-4">
                <RotateCcw className="size-3.5" />
                Reset
              </Button>
            )}
          </div>
        </div>
        {filtersOpen && (
          <div className="mt-3 grid gap-3 border-t border-[#e4ebf0] pt-3 sm:grid-cols-2 lg:grid-cols-4">
            <UserFilter label="Role" value={role} onChange={setRole} options={[["all", "All roles"], ...options.roles.map((item) => [item, roleLabels[item] ?? item] as [string, string])]} />
            <UserFilter label="Email" value={emailStatus} onChange={setEmailStatus} options={[["all", "Any verification status"], ["verified", "Verified"], ["unverified", "Unverified"]]} />
            <UserFilter label="Phone number" value={phoneStatus} onChange={setPhoneStatus} options={[["all", "Any"], ["available", "Has phone number"], ["missing", "Missing phone number"]]} />
            <UserFilter label="Two-factor authentication" value={twoFactor} onChange={setTwoFactor} options={[["all", "Any"], ["enabled", "Enabled"], ["disabled", "Disabled"]]} />
            <UserDateFilter label="Created from" value={createdFrom} onChange={setCreatedFrom} />
            <UserDateFilter label="Created to" value={createdTo} onChange={setCreatedTo} />
          </div>
        )}
      </div>

      <div className="space-y-2 md:hidden">
        {loading ? (
          Array.from({ length: 5 }).map((_, index) => (
            <div key={index} className="h-28 animate-pulse rounded-lg border bg-muted/30" />
          ))
        ) : users.length ? (
          users.map((user) => (
            <UserCard
              key={user.id}
              user={user}
              onEdit={() => openEdit(user)}
              onDelete={() => setDeleteTarget(user)}
            />
          ))
        ) : (
          <div className="rounded-lg border border-dashed bg-card p-6 text-center text-sm text-muted-foreground">
            No users found.
          </div>
        )}
      </div>

      <div className="hidden overflow-hidden rounded-lg border bg-card shadow-sm md:block">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>User</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Permissions</TableHead>
              <TableHead className="w-28 text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableSkeletonRows columns={4} />
            ) : users.length ? users.map((user) => (
              <TableRow key={user.id}>
                <TableCell>
                  <div className="font-medium">{user.full_name}</div>
                  <div className="text-xs text-muted-foreground">{user.email}</div>
                </TableCell>
                <TableCell>
                  <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary">
                    <ShieldCheck className="size-3.5" />
                    {roleLabels[user.role] ?? user.role}
                  </span>
                </TableCell>
                <TableCell className="text-xs text-muted-foreground">
                  {user.permissions.length} permission{user.permissions.length === 1 ? "" : "s"}
                </TableCell>
                <TableCell>
                  <div className="flex justify-end gap-1">
                    <Button type="button" variant="ghost" size="icon-sm" onClick={() => openEdit(user)}>
                      <Edit2 className="size-4" />
                    </Button>
                    <Button type="button" variant="ghost" size="icon-sm" className="text-destructive" onClick={() => setDeleteTarget(user)}>
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            )) : (
              <TableRow><TableCell colSpan={4} className="py-8 text-center text-muted-foreground">No users found.</TableCell></TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit User" : "Create User"}</DialogTitle>
            <DialogDescription>Set account details, role, and extra permission overrides.</DialogDescription>
          </DialogHeader>

          <form onSubmit={submit} className="space-y-4">
            {errors.form && <p className="rounded-lg border border-destructive/20 bg-destructive/10 px-3 py-2 text-sm text-destructive">{errors.form}</p>}

            <div className="grid gap-3 md:grid-cols-2">
              <Field label="Username" error={errors.username}>
                <Input value={form.username} onChange={(event) => setForm({ ...form, username: event.target.value })} />
              </Field>
              <Field label="Email" error={errors.email}>
                <Input type="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} />
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
                  <Input
                    type="text"
                    className="font-mono"
                    value={form.password}
                    onChange={(event) => setForm({ ...form, password: event.target.value })}
                    placeholder={editing ? "Leave blank to keep current password" : "Generated secure password"}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setForm({ ...form, password: generateSecurePassword() })}
                  >
                    <RefreshCw className="size-4" />
                    Generate
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">Use uppercase, lowercase, number, and symbol.</p>
              </Field>
            </div>

            <Field label="Role" error={errors.role}>
              <Select value={form.role} onValueChange={(value) => setForm({ ...form, role: value as StaffRole })}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent>
                  {options.roles.map((item) => (
                    <SelectItem key={item} value={item}>{roleLabels[item] ?? item}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>

            <Field label="Permission Overrides" error={errors.permissions}>
              <MultiSelect
                key={`${editing?.id ?? "new"}-${form.permissions.join(".")}`}
                options={permissionOptions}
                defaultValue={form.permissions}
                onValueChange={(permissions) => setForm({ ...form, permissions })}
                placeholder="Add direct permissions"
                maxCount={4}
                animation={0}
              />
            </Field>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={saving}>{saving ? "Saving..." : "Save User"}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={confirmSaveOpen} onOpenChange={setConfirmSaveOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{editing ? "Save user changes?" : "Create this user?"}</AlertDialogTitle>
            <AlertDialogDescription>
              {editing
                ? "This will update the user account, role, and permission overrides."
                : "This will create a new user account with the selected role and permissions."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={saving}>Review</AlertDialogCancel>
            <AlertDialogAction
              disabled={saving}
              onClick={(event) => {
                event.preventDefault();
                void saveUser();
              }}
            >
              {saving ? "Saving..." : editing ? "Save Changes" : "Create User"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={Boolean(deleteTarget)} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete user?</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteTarget
                ? `${deleteTarget.full_name} will be removed from the system. This action cannot be undone.`
                : "This user will be removed from the system."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive/10 text-destructive hover:bg-destructive/20"
              disabled={deleting}
              onClick={(event) => {
                event.preventDefault();
                void remove();
              }}
            >
              {deleting ? "Deleting..." : "Delete User"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function UserFilter({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: Array<[string, string]>;
}) {
  return (
    <div className="space-y-1">
      <label className="text-xs font-medium text-muted-foreground">{label}</label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger className="h-10 w-full rounded-xl">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {options.map(([optionValue, optionLabel]) => (
            <SelectItem key={optionValue} value={optionValue}>{optionLabel}</SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

function UserDateFilter({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return (
    <div className="space-y-1">
      <label className="text-xs font-medium text-muted-foreground">{label}</label>
      <Input type="date" value={value} onChange={(event) => onChange(event.target.value)} className="h-10 rounded-xl" />
    </div>
  );
}

function UserCard({
  user,
  onEdit,
  onDelete,
}: {
  user: AdminUser;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <article className="rounded-lg border bg-card p-3 shadow-xs">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold">{user.full_name}</p>
          <p className="truncate text-xs text-muted-foreground">{user.email}</p>
        </div>
        <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary">
          <ShieldCheck className="size-3.5" />
          {roleLabels[user.role] ?? user.role}
        </span>
      </div>
      <div className="mt-3 flex items-center justify-between gap-3">
        <p className="text-xs text-muted-foreground">
          {user.permissions.length} permission{user.permissions.length === 1 ? "" : "s"}
        </p>
        <div className="flex gap-1">
          <Button type="button" variant="ghost" size="icon-sm" onClick={onEdit} aria-label={`Edit ${user.full_name}`}>
            <Edit2 className="size-4" />
          </Button>
          <Button type="button" variant="ghost" size="icon-sm" className="text-destructive" onClick={onDelete} aria-label={`Delete ${user.full_name}`}>
            <Trash2 className="size-4" />
          </Button>
        </div>
      </div>
    </article>
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

function permissionLabel(permission: string) {
  return permission
    .split(".")
    .map((part) => part.replaceAll("-", " "))
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" / ");
}

function flattenErrors(errors: Record<string, string[] | string>) {
  return Object.fromEntries(
    Object.entries(errors).map(([key, value]) => [key, Array.isArray(value) ? value[0] : value]),
  );
}
