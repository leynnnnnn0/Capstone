"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Edit2, Plus, RotateCcw, ShieldCheck, SlidersHorizontal, Trash2 } from "lucide-react";
import { toast } from "sonner";

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
import { AdminMobileRecord } from "@/components/ui/admin-mobile-record";
import { Input } from "@/components/ui/input";
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
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import {
  deleteAdminUser,
  fetchAdminUsers,
  fetchUserOptions,
} from "@/features/admin-users/admin-user-api";
import type { AdminUser, UserCollection, UserOptions } from "@/features/admin-users/types";
import { adminUserRoleLabels } from "@/features/admin-users/admin-user-utils";

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
  const [loading, setLoading] = useState(true);
  const [deleteTarget, setDeleteTarget] = useState<AdminUser | null>(null);
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
        <Button asChild size="sm" className="bg-white text-[#162d4a] hover:bg-[#edf3f7]">
          <Link href="/dashboard/users/create">
            <Plus className="size-4" />
            New User
          </Link>
        </Button>
      </div>

      <div className="rounded-[1.25rem] border border-[#dce4ea] bg-white p-3 shadow-[0_12px_38px_rgba(22,45,74,0.04)]">
        <div className="flex min-w-0 items-center gap-2">
          <AdminTableSearch value={search} onChange={setSearch} placeholder="Search users..." />
          <div className="flex shrink-0 gap-2">
            <Button type="button" variant={filtersOpen ? "secondary" : "outline"} size="sm" onClick={() => setFiltersOpen((value) => !value)} className="size-11 shrink-0 gap-1.5 rounded-xl p-0 sm:h-11 sm:w-auto sm:px-4" aria-label="Toggle filters">
              <SlidersHorizontal className="size-3.5" />
              <span className="hidden sm:inline">Filters</span>
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
              }} className="size-11 shrink-0 gap-1.5 rounded-xl p-0 sm:h-11 sm:w-auto sm:px-4" aria-label="Reset filters">
                <RotateCcw className="size-3.5" />
                <span className="hidden sm:inline">Reset</span>
              </Button>
            )}
          </div>
        </div>
        {filtersOpen && (
          <div className="mt-3 grid gap-3 border-t border-[#e4ebf0] pt-3 sm:grid-cols-2 lg:grid-cols-4">
            <UserFilter label="Role" value={role} onChange={setRole} options={[["all", "All roles"], ...options.roles.map((item) => [item, adminUserRoleLabels[item] ?? item] as [string, string])]} />
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
                    {adminUserRoleLabels[user.role] ?? user.role}
                  </span>
                </TableCell>
                <TableCell className="text-xs text-muted-foreground">
                  {user.permissions.length} permission{user.permissions.length === 1 ? "" : "s"}
                </TableCell>
                <TableCell>
                  <div className="flex justify-end gap-1">
                    <Button asChild variant="ghost" size="icon-sm">
                      <Link href={`/dashboard/users/${user.id}/edit`} aria-label={`Edit ${user.full_name}`}>
                        <Edit2 className="size-4" />
                      </Link>
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
  onDelete,
}: {
  user: AdminUser;
  onDelete: () => void;
}) {
  return (
    <AdminMobileRecord>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold">{user.full_name}</p>
          <p className="truncate text-xs text-muted-foreground">{user.email}</p>
        </div>
        <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary">
          <ShieldCheck className="size-3.5" />
          {adminUserRoleLabels[user.role] ?? user.role}
        </span>
      </div>
      <div className="mt-4 flex items-center justify-between gap-3 border-t border-[#e8edf1] pt-3">
        <p className="text-xs text-muted-foreground">
          {user.permissions.length} permission{user.permissions.length === 1 ? "" : "s"}
        </p>
        <div className="flex gap-1">
          <Button asChild variant="ghost" size="icon-sm">
            <Link href={`/dashboard/users/${user.id}/edit`} aria-label={`Edit ${user.full_name}`}>
              <Edit2 className="size-4" />
            </Link>
          </Button>
          <Button type="button" variant="ghost" size="icon-sm" className="text-destructive" onClick={onDelete} aria-label={`Delete ${user.full_name}`}>
            <Trash2 className="size-4" />
          </Button>
        </div>
      </div>
    </AdminMobileRecord>
  );
}
