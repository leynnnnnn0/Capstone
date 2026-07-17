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
  const isWorker = hasRole(user, "worker");

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4 rounded-[1.5rem] border border-white/10 bg-[#162d4a] p-5 text-white shadow-[0_18px_55px_rgba(22,45,74,0.12)] sm:flex-row sm:items-center sm:justify-between sm:p-6">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#b9cfe0]">Field operations</p>
          <h1 className="mt-2 text-2xl font-semibold tracking-[-0.035em] text-white">Work Jobs</h1>
          <p className="mt-1 text-sm text-white/55">{total} total work job{total === 1 ? "" : "s"}</p>
        </div>
        {!isWorker && (
          <Button asChild size="sm" className="gap-1.5 bg-white text-[#162d4a] hover:bg-[#edf3f7]">
            <Link href="/dashboard/work-jobs/create">
              <BriefcaseBusiness className="size-3.5" />
              New Work Job
            </Link>
          </Button>
        )}
      </div>

      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
        <AdminSummaryCard label="Total" value={total} icon={BriefcaseBusiness} tone="blue" />
        <AdminSummaryCard label="Pending" value={workJobs.filter((item) => item.status === CustomerStatus.Pending).length} icon={CalendarDays} tone="mist" />
        <AdminSummaryCard label="In Progress" value={workJobs.filter((item) => item.status === CustomerStatus.InProgress).length} icon={PlayCircle} tone="light" />
        <AdminSummaryCard label="Completed" value={workJobs.filter((item) => item.status === CustomerStatus.Completed).length} icon={CheckCircle2} tone="slate" />
      </div>

      <div className="rounded-[1.25rem] border border-[#dce4ea] bg-white p-3 shadow-[0_12px_38px_rgba(22,45,74,0.04)]">
        <div className="flex min-w-0 items-center gap-2">
          <AdminTableSearch value={search} onChange={setSearch} placeholder="Search by name, phone, work job #..." />
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
          <div className="mt-3 grid gap-2 border-t pt-3 sm:grid-cols-3">
            <FilterSelect label="Status" value={filters.status} options={adminWorkJobStatusOptions} onChange={(value) => applyFilter({ status: value })} />
            <FilterDate label="Date From" value={filters.date_from} onChange={(value) => applyFilter({ date_from: value })} />
            <FilterDate label="Date To" value={filters.date_to} onChange={(value) => applyFilter({ date_to: value })} />
          </div>
        )}
      </div>

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

      <div className="hidden overflow-hidden rounded-lg border bg-card md:block">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Work Job Number</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Phone Number</TableHead>
              <TableHead>Schedule</TableHead>
              <TableHead>Workers</TableHead>
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
      </div>

      {meta && meta.last_page > 1 && (
        <div className="flex items-center justify-end gap-2">
          <Button variant="outline" size="sm" disabled={meta.current_page <= 1} onClick={() => applyFilter({ page: String(meta.current_page - 1) })}>
            Previous
          </Button>
          <span className="text-sm text-muted-foreground">
            Page {meta.current_page} of {meta.last_page}
          </span>
          <Button variant="outline" size="sm" disabled={meta.current_page >= meta.last_page} onClick={() => applyFilter({ page: String(meta.current_page + 1) })}>
            Next
          </Button>
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
              <Badge variant="outline" className="border-blue-100 bg-blue-50 text-[10px] font-medium text-primary">
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
          <p className="text-muted-foreground">Workers</p>
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
      <TableCell className="font-medium">
        <div className="flex flex-col gap-1">
          <span>{workJob.work_job_number}</span>
          {workJob.is_back_job && (
            <Badge variant="outline" className="w-fit border-blue-100 bg-blue-50 text-[10px] font-medium text-primary">
              Back Job
            </Badge>
          )}
        </div>
      </TableCell>
      <TableCell>{workJob.full_name}</TableCell>
      <TableCell>{workJob.phone_number}</TableCell>
      <TableCell>{formatWorkJobSchedule(workJob)}</TableCell>
      <TableCell>{workJob.workers.length > 0 ? workJob.workers.map((worker) => worker.full_name).join(", ") : "-"}</TableCell>
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
