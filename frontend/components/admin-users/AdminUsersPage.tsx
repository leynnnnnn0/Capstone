"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Edit2, Plus, RotateCcw, ShieldCheck, SlidersHorizontal, Trash2, UserRound, UsersRound } from "lucide-react";
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
  TableFrame,
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
import type { AdminUser, StaffRole, UserCollection, UserOptions } from "@/features/admin-users/types";
import { adminUserRoleBadgeClasses, adminUserRoleLabels } from "@/features/admin-users/admin-user-utils";
import AdminSummaryCard from "@/components/admin/AdminSummaryCard";

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
  const totalUsers = response?.meta?.total ?? users.length;
  const staffUsers = users.filter((user) => user.role !== "customer").length;
  const customerUsers = users.filter((user) => user.role === "customer").length;
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
    <div className="space-y-10">
      <section className="flex flex-col gap-5 border-b pb-8 sm:gap-8 sm:pb-10 lg:flex-row lg:items-center lg:justify-between">
        <div className="max-w-3xl">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#64879a]">
            Administration · User accounts
          </p>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight text-[#2d425b] sm:mt-4 sm:text-4xl">Users</h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-[#71869c] sm:mt-4 sm:text-base sm:leading-7">
            Manage staff and customer accounts, review assigned roles and permissions, and update access when responsibilities change.
          </p>
        </div>
        <div className="flex shrink-0 flex-col items-start gap-5 lg:items-end">
          <Button asChild size="lg" className="gap-2 bg-[#2d425b] hover:bg-[#23364b]">
            <Link href="/dashboard/users/create">
              <Plus className="size-4" />
              New user
            </Link>
          </Button>
          <div className="hidden items-center gap-3 md:flex">
            <span className="flex size-10 items-center justify-center rounded-lg bg-[#eef4f7] text-[#64879a]">
              <UsersRound className="size-4" />
            </span>
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#8194a7]">Directory</p>
              <p className="mt-0.5 text-sm font-semibold text-[#2d425b]">{totalUsers} registered user{totalUsers === 1 ? "" : "s"}</p>
            </div>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-2 gap-x-4 border-b pb-8 sm:grid-cols-3 sm:gap-x-7 sm:pb-10 [&>*:first-child]:col-span-2 sm:[&>*:first-child]:col-span-1">
        <AdminSummaryCard label="Accounts" value={totalUsers} icon={UsersRound} eyebrow="Live workspace" description="all registered users" />
        <AdminSummaryCard label="Staff on this page" value={staffUsers} icon={ShieldCheck} eyebrow="Live workspace" description="administrative and field staff" />
        <AdminSummaryCard label="Customers on this page" value={customerUsers} icon={UserRound} eyebrow="Live workspace" description="customer portal users" />
      </section>

      <section className="space-y-4">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#64879a]">Directory</p>
            <h2 className="mt-2 text-xl font-semibold tracking-tight text-[#2d425b]">User accounts</h2>
          </div>
          <div className="flex min-w-0 items-center gap-2 lg:w-[34rem]">
          <AdminTableSearch value={search} onChange={setSearch} placeholder="Search users..." />
          <div className="flex shrink-0 gap-2">
            <Button type="button" variant="default" size="sm" onClick={() => setFiltersOpen((value) => !value)} className="size-11 shrink-0 gap-1.5 rounded-lg bg-[#2d425b] p-0 text-white hover:bg-[#23364b] sm:h-11 sm:w-auto sm:px-4" aria-label="Toggle filters">
              <SlidersHorizontal className="size-3.5" />
              <span className="hidden sm:inline">Filter</span>
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
        </div>
        {filtersOpen && (
          <div className="grid gap-3 rounded-lg border bg-card p-4 sm:grid-cols-2 lg:grid-cols-4">
            <UserFilter label="Role" value={role} onChange={setRole} options={[["all", "All roles"], ...options.roles.map((item) => [item, adminUserRoleLabels[item] ?? item] as [string, string])]} />
            <UserFilter label="Email" value={emailStatus} onChange={setEmailStatus} options={[["all", "Any verification status"], ["verified", "Verified"], ["unverified", "Unverified"]]} />
            <UserFilter label="Phone number" value={phoneStatus} onChange={setPhoneStatus} options={[["all", "Any"], ["available", "Has phone number"], ["missing", "Missing phone number"]]} />
            <UserFilter label="Two-factor authentication" value={twoFactor} onChange={setTwoFactor} options={[["all", "Any"], ["enabled", "Enabled"], ["disabled", "Disabled"]]} />
            <UserDateFilter label="Created from" value={createdFrom} onChange={setCreatedFrom} />
            <UserDateFilter label="Created to" value={createdTo} onChange={setCreatedTo} />
          </div>
        )}
      </section>

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

      <TableFrame className="hidden md:block">
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
                  <UserRoleBadge role={user.role} />
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
      </TableFrame>

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
        <UserRoleBadge role={user.role} />
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

function UserRoleBadge({ role }: { role: StaffRole }) {
  return (
    <span className={`inline-flex shrink-0 items-center gap-1 rounded-full px-3 py-1.5 text-xs font-semibold leading-none ${adminUserRoleBadgeClasses[role]}`}>
      <ShieldCheck className="size-3.5" />
      {adminUserRoleLabels[role]}
    </span>
  );
}
