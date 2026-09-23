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
import { DateField } from "@/components/ui/date-field";
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
  const isWorker = hasRole(user, "staff");

  return (
    <div className="space-y-10">
      <section className="flex flex-col gap-5 border-b pb-8 sm:gap-8 sm:pb-10 lg:flex-row lg:items-center lg:justify-between">
        <div className="max-w-3xl">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#64879a]">
            Administration · Customer scheduling
          </p>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight text-[#2d425b] sm:mt-4 sm:text-4xl">Appointments</h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-[#71869c] sm:mt-4 sm:text-base sm:leading-7">
            Review customer requests, confirm schedules, and coordinate inspections from one operational view.
          </p>
        </div>
        <div className="flex shrink-0 flex-col items-start gap-5 lg:items-end">
          {!isWorker && (
            <Button asChild size="lg" className="gap-2 bg-[#2d425b] hover:bg-[#23364b]">
              <Link href="/dashboard/appointments/create">
                <CalendarDays className="size-4" />
                Create appointment
              </Link>
            </Button>
          )}
          <div className="hidden items-center gap-3 md:flex">
            <span className="flex size-10 items-center justify-center rounded-lg bg-[#eef4f7] text-[#64879a]">
              <CalendarDays className="size-4" />
            </span>
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#8194a7]">Scheduling</p>
              <p className="mt-0.5 text-sm font-semibold text-[#2d425b]">{total} appointment{total === 1 ? "" : "s"}</p>
            </div>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-2 gap-x-4 border-b pb-8 sm:gap-x-7 sm:pb-10 xl:grid-cols-4">
        <AdminSummaryCard label="Total" value={total} icon={ClipboardList} tone="blue" eyebrow="Appointments" description="all appointment records" />
        <AdminSummaryCard label="Pending" value={appointments.filter((item) => item.status === "pending").length} icon={CalendarDays} tone="mist" eyebrow="Appointments" description="awaiting confirmation" />
        <AdminSummaryCard label="Confirmed" value={appointments.filter((item) => item.status === "confirmed").length} icon={UserCheck} tone="light" eyebrow="Appointments" description="scheduled customer visits" />
        <AdminSummaryCard label="Completed" value={appointments.filter((item) => item.status === "completed").length} icon={ClipboardList} tone="slate" eyebrow="Appointments" description="finished appointments" />
      </section>

      <section className="space-y-4">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#64879a]">Scheduling</p>
            <h2 className="mt-2 text-xl font-semibold tracking-tight text-[#2d425b]">Appointment records</h2>
          </div>
          <div className="flex min-w-0 items-center gap-2 lg:w-[38rem]">
          <AdminTableSearch value={search} onChange={setSearch} placeholder="Search by name, phone, appointment #..." />
          <div className="flex shrink-0 gap-2">
            <Button type="button" variant="default" size="sm" onClick={() => setFiltersOpen((value) => !value)} className="size-11 shrink-0 gap-1.5 rounded-lg bg-[#2d425b] p-0 text-white hover:bg-[#23364b] sm:h-11 sm:w-auto sm:px-4" aria-label="Toggle filters">
              <SlidersHorizontal className="size-3.5" />
              <span className="hidden sm:inline">Filter</span>
            </Button>
            {activeFilters && (
              <Button type="button" variant="ghost" size="sm" onClick={resetFilters} className="size-11 shrink-0 gap-1.5 rounded-xl p-0 sm:h-11 sm:w-auto sm:px-4" aria-label="Reset filters">
                <RotateCcw className="size-3.5" />
                <span className="hidden sm:inline">Reset</span>
              </Button>
            )}
          </div>
        </div>
        </div>
        {filtersOpen && (
          <div className="grid gap-3 rounded-lg border bg-card p-4 sm:grid-cols-4">
            <FilterSelect label="Status" value={filters.status} options={adminStatusOptions} onChange={(value) => applyFilter({ status: value })} />
            <FilterSelect label="Service" value={filters.service_type} options={adminServiceOptions} onChange={(value) => applyFilter({ service_type: value })} />
            <FilterDate label="Date From" value={filters.date_from} onChange={(value) => applyFilter({ date_from: value })} />
            <FilterDate label="Date To" value={filters.date_to} onChange={(value) => applyFilter({ date_to: value })} />
          </div>
        )}
      </section>

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

      <TableFrame className="hidden md:block">
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
      </TableFrame>

      {meta && meta.last_page > 1 && (
        <div className="flex items-center justify-between gap-3 rounded-lg border bg-white px-4 py-3">
          <span className="rounded-md bg-muted px-3 py-1.5 text-xs font-medium text-muted-foreground">
            Page {meta.current_page} of {meta.last_page}
          </span>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" disabled={meta.current_page <= 1} onClick={() => applyFilter({ page: String(meta.current_page - 1) }, { resetPage: false })}>
              Previous
            </Button>
            <Button variant="outline" size="sm" disabled={meta.current_page >= meta.last_page} onClick={() => applyFilter({ page: String(meta.current_page + 1) }, { resetPage: false })}>
              Next
            </Button>
          </div>
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
      <TableCell className="font-semibold text-[#162d4a]">{appointment.appointment_number}</TableCell>
      <TableCell className="font-medium">{appointment.full_name}</TableCell>
      <TableCell className="text-muted-foreground">{appointment.phone_number}</TableCell>
      <TableCell className="capitalize">{appointment.preferred_time}</TableCell>
      <TableCell className="whitespace-nowrap tabular-nums">{formatAdminDate(appointment.preferred_date)}</TableCell>
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
      <DateField className="h-9" value={value} onChange={onChange} />
    </div>
  );
}
