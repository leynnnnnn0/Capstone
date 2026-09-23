"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import AdminSummaryCard from "@/components/admin/AdminSummaryCard";
import { useRouter, useSearchParams } from "next/navigation";
import {
  BriefcaseBusiness,
  CalendarDays,
  CheckCircle2,
  Eye,
  PlayCircle,
  RotateCcw,
  SlidersHorizontal,
} from "lucide-react";

import AdminWorkJobStatusBadge from "@/components/admin-work-jobs/AdminWorkJobStatusBadge";
import { AdminTableSearch } from "@/components/ui/admin-table-search";
import { AdminMobileRecord, AdminMobileRecordDetail } from "@/components/ui/admin-mobile-record";
import { Badge } from "@/components/ui/badge";
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
  TableFrame,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { fetchAdminWorkJobs } from "@/features/admin-work-jobs/admin-work-job-api";
import { hasRole } from "@/features/auth/current-user-api";
import {
  adminWorkJobStatusOptions,
  formatWorkJobSchedule,
} from "@/features/admin-work-jobs/admin-work-job-utils";
import { CustomerStatus } from "@/features/customer/status";
import type { AdminWorkJob, WorkJobCollection } from "@/features/admin-work-jobs/types";
import { useRealtimeRefresh } from "@/hooks/use-realtime";
import { useCurrentUser } from "@/hooks/use-current-user";
import { useDebouncedValue } from "@/hooks/use-debounced-value";

export default function AdminWorkJobsPage() {
  const { user } = useCurrentUser();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [response, setResponse] = useState<WorkJobCollection | null>(null);
  const [loading, setLoading] = useState(true);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [search, setSearch] = useState(searchParams.get("search") ?? "");

  const filters = useMemo(
    () => ({
      search: searchParams.get("search") ?? "",
      status: searchParams.get("status") ?? "all",
      date_from: searchParams.get("date_from") ?? "",
      date_to: searchParams.get("date_to") ?? "",
      page: searchParams.get("page") ?? "1",
      per_page: searchParams.get("per_page") ?? "10",
    }),
    [searchParams],
  );
  const debouncedSearch = useDebouncedValue(search.trim());

  const reload = useCallback(() => {
    let mounted = true;

    fetchAdminWorkJobs(filters)
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
    params.delete("page");
    if (debouncedSearch) params.set("search", debouncedSearch);
    else params.delete("search");
    router.replace(`/dashboard/work-jobs${params.toString() ? `?${params.toString()}` : ""}`);
  }, [debouncedSearch, filters.search, router, search, searchParams]);
  useRealtimeRefresh(() => {
    setLoading(true);
    reload();
  }, ["work_job"]);

  function applyFilter(next: Record<string, string>) {
    const cleanNext = normalizeDateRange(filters, next);
    const params = new URLSearchParams(searchParams.toString());
    Object.entries(cleanNext).forEach(([key, value]) => {
      if (!value || value === "all") params.delete(key);
      else params.set(key, value);
    });
    params.delete("page");
    router.push(`/dashboard/work-jobs${params.toString() ? `?${params.toString()}` : ""}`);
  }

  function resetFilters() {
    setSearch("");
    router.push("/dashboard/work-jobs");
  }

  const workJobs = response?.data ?? [];
  const meta = response?.meta;
  const total = meta?.total ?? workJobs.length;
  const activeFilters = Boolean(filters.search || filters.status !== "all" || filters.date_from || filters.date_to);
  const isWorker = hasRole(user, "staff");

  return (
    <div className="space-y-10">
      <section className="flex flex-col gap-5 border-b pb-8 sm:gap-8 sm:pb-10 lg:flex-row lg:items-center lg:justify-between">
        <div className="max-w-3xl">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#64879a]">
            Administration · Field operations
          </p>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight text-[#2d425b] sm:mt-4 sm:text-4xl">Work jobs</h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-[#71869c] sm:mt-4 sm:text-base sm:leading-7">
            Coordinate installations, monitor job progress, and keep field assignments moving on schedule.
          </p>
        </div>
        <div className="flex shrink-0 flex-col items-start gap-5 lg:items-end">
          {!isWorker && (
            <Button asChild size="lg" className="gap-2 bg-[#2d425b] hover:bg-[#23364b]">
              <Link href="/dashboard/work-jobs/create">
                <BriefcaseBusiness className="size-4" />
                Create work job
              </Link>
            </Button>
          )}
          <div className="hidden items-center gap-3 md:flex">
            <span className="flex size-10 items-center justify-center rounded-lg bg-[#eef4f7] text-[#64879a]">
              <BriefcaseBusiness className="size-4" />
            </span>
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#8194a7]">Operations</p>
              <p className="mt-0.5 text-sm font-semibold text-[#2d425b]">{total} work job{total === 1 ? "" : "s"}</p>
            </div>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-2 gap-x-4 border-b pb-8 sm:gap-x-7 sm:pb-10 xl:grid-cols-4">
        <AdminSummaryCard label="Total" value={total} icon={BriefcaseBusiness} tone="blue" eyebrow="Field work" description="all work job records" />
        <AdminSummaryCard label="Pending" value={workJobs.filter((item) => item.status === CustomerStatus.Pending).length} icon={CalendarDays} tone="mist" eyebrow="Field work" description="awaiting assignment" />
        <AdminSummaryCard label="In Progress" value={workJobs.filter((item) => item.status === CustomerStatus.InProgress).length} icon={PlayCircle} tone="light" eyebrow="Field work" description="active installation jobs" />
        <AdminSummaryCard label="Completed" value={workJobs.filter((item) => item.status === CustomerStatus.Completed).length} icon={CheckCircle2} tone="slate" eyebrow="Field work" description="finished work jobs" />
      </section>

      <section className="space-y-4">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#64879a]">Operations</p>
            <h2 className="mt-2 text-xl font-semibold tracking-tight text-[#2d425b]">Work job records</h2>
          </div>
          <div className="flex min-w-0 items-center gap-2 lg:w-[38rem]">
          <AdminTableSearch value={search} onChange={setSearch} placeholder="Search by name, phone, work job #..." />
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
          <div className="grid gap-3 rounded-lg border bg-card p-4 sm:grid-cols-3">
            <FilterSelect label="Status" value={filters.status} options={adminWorkJobStatusOptions} onChange={(value) => applyFilter({ status: value })} />
            <FilterDate label="Date From" value={filters.date_from} onChange={(value) => applyFilter({ date_from: value })} />
            <FilterDate label="Date To" value={filters.date_to} onChange={(value) => applyFilter({ date_to: value })} />
          </div>
        )}
      </section>

      <div className="space-y-2 md:hidden">
        {loading ? (
          Array.from({ length: 5 }).map((_, index) => (
            <div key={index} className="h-32 animate-pulse rounded-lg border bg-muted/30" />
          ))
        ) : workJobs.length > 0 ? (
          workJobs.map((workJob) => <WorkJobCard key={workJob.id} workJob={workJob} />)
        ) : (
          <div className="rounded-lg border border-dashed bg-card p-6 text-center text-sm text-muted-foreground">
            No work jobs found.
          </div>
        )}
      </div>

      <TableFrame className="hidden md:block">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Work Job Number</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Phone Number</TableHead>
              <TableHead>Schedule</TableHead>
              <TableHead>Staff</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableSkeletonRows columns={7} />
            ) : workJobs.length > 0 ? (
              workJobs.map((workJob) => <WorkJobRow key={workJob.id} workJob={workJob} />)
            ) : (
              <TableRow>
                <TableCell colSpan={7} className="py-8 text-center text-muted-foreground">No work jobs found.</TableCell>
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
            <Button variant="outline" size="sm" disabled={meta.current_page <= 1} onClick={() => applyFilter({ page: String(meta.current_page - 1) })}>
              Previous
            </Button>
            <Button variant="outline" size="sm" disabled={meta.current_page >= meta.last_page} onClick={() => applyFilter({ page: String(meta.current_page + 1) })}>
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

function WorkJobCard({ workJob }: { workJob: AdminWorkJob }) {
  return (
    <AdminMobileRecord>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-1.5">
            <p className="truncate text-xs font-semibold uppercase tracking-wide text-primary">
              {workJob.work_job_number}
            </p>
            {workJob.is_back_job && (
              <Badge variant="outline" className="border-transparent bg-blue-600 text-[10px] text-white">
                Back Job
              </Badge>
            )}
          </div>
          <p className="mt-1 truncate text-sm font-semibold">{workJob.full_name}</p>
          <p className="mt-0.5 text-xs text-muted-foreground">{workJob.phone_number}</p>
        </div>
        <Button asChild variant="ghost" size="icon-sm" aria-label={`View ${workJob.work_job_number}`} className="shrink-0">
          <Link href={`/dashboard/work-jobs/${workJob.id}`}>
            <Eye className="size-4" />
          </Link>
        </Button>
      </div>
      <div className="mt-3 grid gap-2 text-xs">
        <AdminMobileRecordDetail>
          <p className="text-muted-foreground">Schedule</p>
          <p className="font-medium">{formatWorkJobSchedule(workJob)}</p>
        </AdminMobileRecordDetail>
        <AdminMobileRecordDetail>
          <p className="text-muted-foreground">Staff</p>
          <p className="font-medium">
            {workJob.workers.length > 0 ? workJob.workers.map((worker) => worker.full_name).join(", ") : "-"}
          </p>
        </AdminMobileRecordDetail>
      </div>
      <div className="mt-3">
        <AdminWorkJobStatusBadge status={workJob.status} />
      </div>
    </AdminMobileRecord>
  );
}

function WorkJobRow({ workJob }: { workJob: AdminWorkJob }) {
  return (
    <TableRow>
      <TableCell className="font-semibold text-[#162d4a]">
        <div className="flex flex-col gap-1">
          <span>{workJob.work_job_number}</span>
          {workJob.is_back_job && (
            <Badge variant="outline" className="w-fit border-transparent bg-blue-600 text-[10px] text-white">
              Back Job
            </Badge>
          )}
        </div>
      </TableCell>
      <TableCell className="font-medium">{workJob.full_name}</TableCell>
      <TableCell className="text-muted-foreground">{workJob.phone_number}</TableCell>
      <TableCell className="whitespace-nowrap tabular-nums">{formatWorkJobSchedule(workJob)}</TableCell>
      <TableCell className="max-w-[240px] text-muted-foreground">{workJob.workers.length > 0 ? workJob.workers.map((worker) => worker.full_name).join(", ") : "-"}</TableCell>
      <TableCell><AdminWorkJobStatusBadge status={workJob.status} /></TableCell>
      <TableCell className="text-right">
        <Button asChild variant="ghost" size="icon-sm" aria-label={`View ${workJob.work_job_number}`}>
          <Link href={`/dashboard/work-jobs/${workJob.id}`}>
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
