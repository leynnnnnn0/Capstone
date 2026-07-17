"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import AdminSummaryCard from "@/components/admin/AdminSummaryCard";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  CalendarDays,
  ClipboardList,
  Eye,
  RotateCcw,
  SlidersHorizontal,
  UserCheck,
} from "lucide-react";

import AdminAppointmentStatusBadge from "@/components/admin-appointments/AdminAppointmentStatusBadge";
import { AdminTableSearch } from "@/components/ui/admin-table-search";
import { AdminMobileRecord, AdminMobileRecordDetail } from "@/components/ui/admin-mobile-record";
import { Button } from "@/components/ui/button";
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
import { fetchAdminAppointments } from "@/features/admin-appointments/admin-appointment-api";
import { hasRole } from "@/features/auth/current-user-api";
import {
  adminServiceOptions,
  adminStatusOptions,
  formatAdminDate,
} from "@/features/admin-appointments/admin-appointment-utils";
import type { AdminAppointment, AppointmentCollection } from "@/features/admin-appointments/types";
import { useRealtimeRefresh } from "@/hooks/use-realtime";
import { useCurrentUser } from "@/hooks/use-current-user";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { currentPathWithSearch, withReturnTo } from "@/lib/return-to";

export default function AdminAppointmentsPage() {
  const { user } = useCurrentUser();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [response, setResponse] = useState<AppointmentCollection | null>(null);
  const [loading, setLoading] = useState(true);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [search, setSearch] = useState(searchParams.get("search") ?? "");

  const filters = useMemo(
    () => ({
      search: searchParams.get("search") ?? "",
      status: searchParams.get("status") ?? "all",
      service_type: searchParams.get("service_type") ?? "all",
      date_from: searchParams.get("date_from") ?? "",
      date_to: searchParams.get("date_to") ?? "",
      page: searchParams.get("page") ?? "1",
      per_page: searchParams.get("per_page") ?? "10",
    }),
    [searchParams],
  );
  const debouncedSearch = useDebouncedValue(search.trim());
  const returnTo = useMemo(() => currentPathWithSearch(pathname, searchParams), [pathname, searchParams]);

  const reload = useCallback(() => {
    let mounted = true;

    fetchAdminAppointments(filters)
      .then((nextResponse) => {
        if (mounted) setResponse(nextResponse);
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [filters]);

  useEffect(() => reload(), [reload]);
  useEffect(() => {
    if (search.trim() !== debouncedSearch) return;
    if (debouncedSearch === filters.search) return;
    const params = new URLSearchParams(searchParams.toString());
    params.delete("returnTo");
    params.delete("page");
    if (debouncedSearch) params.set("search", debouncedSearch);
    else params.delete("search");
    router.replace(`/dashboard/appointments${params.toString() ? `?${params.toString()}` : ""}`);
  }, [debouncedSearch, filters.search, router, search, searchParams]);
  useRealtimeRefresh(() => {
    setLoading(true);
    reload();
  }, ["appointment", "quotation"]);

  function applyFilter(next: Record<string, string>, options: { resetPage?: boolean } = {}) {
    const cleanNext = normalizeDateRange(filters, next);
    const params = new URLSearchParams(searchParams.toString());
    params.delete("returnTo");
    Object.entries(cleanNext).forEach(([key, value]) => {
      if (!value || value === "all") params.delete(key);
      else params.set(key, value);
    });
    if (options.resetPage !== false) params.delete("page");
    router.push(`/dashboard/appointments${params.toString() ? `?${params.toString()}` : ""}`);
  }

  function resetFilters() {
    setSearch("");
    router.push("/dashboard/appointments");
  }

  const appointments = response?.data ?? [];
  const meta = response?.meta;
  const total = response?.meta?.total ?? appointments.length;
  const activeFilters = Boolean(filters.search || filters.status !== "all" || filters.service_type !== "all" || filters.date_from || filters.date_to);
  const isWorker = hasRole(user, "worker");

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4 rounded-[1.5rem] border border-white/10 bg-[#162d4a] p-5 text-white shadow-[0_18px_55px_rgba(22,45,74,0.12)] sm:flex-row sm:items-center sm:justify-between sm:p-6">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#b9cfe0]">Customer scheduling</p>
          <h1 className="mt-2 text-2xl font-semibold tracking-[-0.035em] text-white">Appointments</h1>
          <p className="mt-1 text-sm text-white/55">{total} total appointment{total === 1 ? "" : "s"}</p>
        </div>
        {!isWorker && (
          <Button asChild size="sm" className="gap-1.5 bg-white text-[#162d4a] hover:bg-[#edf3f7]">
            <Link href="/dashboard/appointments/create">
              <CalendarDays className="size-3.5" />
              New Appointment
            </Link>
          </Button>
        )}
      </div>

      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
        <AdminSummaryCard label="Total" value={total} icon={ClipboardList} tone="blue" />
        <AdminSummaryCard label="Pending" value={appointments.filter((item) => item.status === "pending").length} icon={CalendarDays} tone="mist" />
        <AdminSummaryCard label="Confirmed" value={appointments.filter((item) => item.status === "confirmed").length} icon={UserCheck} tone="light" />
        <AdminSummaryCard label="Completed" value={appointments.filter((item) => item.status === "completed").length} icon={ClipboardList} tone="slate" />
      </div>

      <div className="rounded-[1.25rem] border border-[#dce4ea] bg-white p-3 shadow-[0_12px_38px_rgba(22,45,74,0.04)]">
        <div className="flex min-w-0 items-center gap-2">
          <AdminTableSearch value={search} onChange={setSearch} placeholder="Search by name, phone, appointment #..." />
          <div className="flex shrink-0 gap-2">
            <Button type="button" variant={filtersOpen ? "secondary" : "outline"} size="sm" onClick={() => setFiltersOpen((value) => !value)} className="size-11 shrink-0 gap-1.5 rounded-xl p-0 sm:h-11 sm:w-auto sm:px-4" aria-label="Toggle filters">
              <SlidersHorizontal className="size-3.5" />
              <span className="hidden sm:inline">Filters</span>
            </Button>
            {activeFilters && (
              <Button type="button" variant="ghost" size="sm" onClick={resetFilters} className="size-11 shrink-0 gap-1.5 rounded-xl p-0 sm:h-11 sm:w-auto sm:px-4" aria-label="Reset filters">
                <RotateCcw className="size-3.5" />
                <span className="hidden sm:inline">Reset</span>
              </Button>
            )}
          </div>
        </div>
        {filtersOpen && (
          <div className="mt-3 grid gap-2 border-t pt-3 sm:grid-cols-4">
            <FilterSelect label="Status" value={filters.status} options={adminStatusOptions} onChange={(value) => applyFilter({ status: value })} />
            <FilterSelect label="Service" value={filters.service_type} options={adminServiceOptions} onChange={(value) => applyFilter({ service_type: value })} />
            <FilterDate label="Date From" value={filters.date_from} onChange={(value) => applyFilter({ date_from: value })} />
            <FilterDate label="Date To" value={filters.date_to} onChange={(value) => applyFilter({ date_to: value })} />
          </div>
        )}
      </div>

      <div className="space-y-2 md:hidden">
        {loading ? (
          Array.from({ length: 5 }).map((_, index) => (
            <div key={index} className="h-28 animate-pulse rounded-lg border bg-muted/30" />
          ))
        ) : appointments.length > 0 ? (
          appointments.map((appointment) => (
            <AppointmentCard key={appointment.id} appointment={appointment} returnTo={returnTo} />
          ))
        ) : (
          <div className="rounded-lg border border-dashed bg-card p-6 text-center text-sm text-muted-foreground">
            No appointments found.
          </div>
        )}
      </div>

      <div className="hidden overflow-hidden rounded-lg border bg-card md:block">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Appointment Number</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Phone Number</TableHead>
              <TableHead>Preferred Time</TableHead>
              <TableHead>Preferred Date</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableSkeletonRows columns={7} />
            ) : appointments.length > 0 ? (
              appointments.map((appointment) => <AppointmentRow key={appointment.id} appointment={appointment} returnTo={returnTo} />)
            ) : (
              <TableRow>
                <TableCell colSpan={7} className="py-8 text-center text-muted-foreground">No appointments found.</TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {meta && meta.last_page > 1 && (
        <div className="flex items-center justify-end gap-2">
          <Button variant="outline" size="sm" disabled={meta.current_page <= 1} onClick={() => applyFilter({ page: String(meta.current_page - 1) }, { resetPage: false })}>
            Previous
          </Button>
          <span className="text-sm text-muted-foreground">
            Page {meta.current_page} of {meta.last_page}
          </span>
          <Button variant="outline" size="sm" disabled={meta.current_page >= meta.last_page} onClick={() => applyFilter({ page: String(meta.current_page + 1) }, { resetPage: false })}>
            Next
          </Button>
        </div>
      )}
    </div>
  );
}

function AppointmentCard({ appointment, returnTo }: { appointment: AdminAppointment; returnTo: string }) {
  return (
    <AdminMobileRecord>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-xs font-semibold uppercase tracking-wide text-primary">
            {appointment.appointment_number}
          </p>
          <p className="mt-1 truncate text-sm font-semibold">{appointment.full_name}</p>
          <p className="mt-0.5 text-xs text-muted-foreground">{appointment.phone_number}</p>
        </div>
        <Button asChild variant="ghost" size="icon-sm" aria-label={`View ${appointment.appointment_number}`} className="shrink-0">
          <Link href={withReturnTo(`/dashboard/appointments/${appointment.id}`, returnTo)}>
            <Eye className="size-4" />
          </Link>
        </Button>
      </div>
      <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
        <AdminMobileRecordDetail>
          <p className="text-muted-foreground">Preferred Date</p>
          <p className="font-medium">{formatAdminDate(appointment.preferred_date)}</p>
        </AdminMobileRecordDetail>
        <AdminMobileRecordDetail>
          <p className="text-muted-foreground">Preferred Time</p>
          <p className="font-medium capitalize">{appointment.preferred_time}</p>
        </AdminMobileRecordDetail>
      </div>
      <div className="mt-3">
        <AdminAppointmentStatusBadge status={appointment.status} />
      </div>
    </AdminMobileRecord>
  );
}

function AppointmentRow({ appointment, returnTo }: { appointment: AdminAppointment; returnTo: string }) {
  return (
    <TableRow>
      <TableCell className="font-medium">{appointment.appointment_number}</TableCell>
      <TableCell>{appointment.full_name}</TableCell>
      <TableCell>{appointment.phone_number}</TableCell>
      <TableCell className="capitalize">{appointment.preferred_time}</TableCell>
      <TableCell>{formatAdminDate(appointment.preferred_date)}</TableCell>
      <TableCell><AdminAppointmentStatusBadge status={appointment.status} /></TableCell>
      <TableCell className="text-right">
        <Button asChild variant="ghost" size="icon-sm" aria-label={`View ${appointment.appointment_number}`}>
          <Link href={withReturnTo(`/dashboard/appointments/${appointment.id}`, returnTo)}>
            <Eye className="size-4" />
          </Link>
        </Button>
      </TableCell>
    </TableRow>
  );
}

function FilterSelect({ label, value, options, onChange }: { label: string; value: string; options: { value: string; label: string }[]; onChange: (value: string) => void }) {
  return (
    <div className="space-y-1">
      <label className="text-xs font-medium text-muted-foreground">{label}</label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger className="h-9 w-full">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {options.map((option) => <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>)}
        </SelectContent>
      </Select>
    </div>
  );
}

function normalizeDateRange(current: { date_from: string; date_to: string }, next: Record<string, string>) {
  const dateFrom = next.date_from ?? current.date_from;
  const dateTo = next.date_to ?? current.date_to;

  if (!dateFrom || !dateTo || dateTo >= dateFrom) return next;

  return next.date_from !== undefined
    ? { ...next, date_to: dateFrom }
    : { ...next, date_from: dateTo };
}

function FilterDate({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return (
    <div className="space-y-1">
      <label className="text-xs font-medium text-muted-foreground">{label}</label>
      <Input type="date" className="h-9" value={value} onChange={(event) => onChange(event.target.value)} />
    </div>
  );
}
