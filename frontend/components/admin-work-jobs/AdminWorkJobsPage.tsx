"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { ComponentType } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  BriefcaseBusiness,
  CalendarDays,
  CheckCircle2,
  Eye,
  PlayCircle,
  RotateCcw,
  Search,
  SlidersHorizontal,
} from "lucide-react";

import AdminWorkJobStatusBadge from "@/components/admin-work-jobs/AdminWorkJobStatusBadge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import type { AdminWorkJob, WorkJobCollection } from "@/features/admin-work-jobs/types";
import { useRealtimeRefresh } from "@/hooks/use-realtime";
import { useCurrentUser } from "@/hooks/use-current-user";

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
  useRealtimeRefresh(() => {
    setLoading(true);
    reload();
  }, ["work_job"]);

  function applyFilter(next: Record<string, string>) {
    const params = new URLSearchParams(searchParams.toString());
    Object.entries(next).forEach(([key, value]) => {
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
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Work Jobs</h1>
          <p className="text-sm text-muted-foreground">{total} total work job{total === 1 ? "" : "s"}</p>
        </div>
        {!isWorker && (
          <Button asChild size="sm" className="gap-1.5">
            <Link href="/dashboard/work-jobs/create">
              <BriefcaseBusiness className="size-3.5" />
              New Work Job
            </Link>
          </Button>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard label="Total" value={total} icon={BriefcaseBusiness} />
        <StatCard label="Pending" value={workJobs.filter((item) => item.status === "pending").length} icon={CalendarDays} />
        <StatCard label="In Progress" value={workJobs.filter((item) => item.status === "in_progress").length} icon={PlayCircle} />
        <StatCard label="Completed" value={workJobs.filter((item) => item.status === "completed").length} icon={CheckCircle2} />
      </div>

      <div className="rounded-lg border bg-card p-3">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search by name, phone, work job #..."
              className="pl-8"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") applyFilter({ search });
              }}
            />
          </div>
          <Button type="button" variant={filtersOpen ? "secondary" : "outline"} size="sm" onClick={() => setFiltersOpen((value) => !value)} className="gap-1.5">
            <SlidersHorizontal className="size-3.5" />
            Filters
          </Button>
          {activeFilters && (
            <Button type="button" variant="ghost" size="sm" onClick={resetFilters} className="gap-1.5">
              <RotateCcw className="size-3.5" />
              Reset
            </Button>
          )}
        </div>
        {filtersOpen && (
          <div className="mt-3 grid gap-2 border-t pt-3 sm:grid-cols-3">
            <FilterSelect label="Status" value={filters.status} options={adminWorkJobStatusOptions} onChange={(value) => applyFilter({ status: value })} />
            <FilterDate label="Date From" value={filters.date_from} onChange={(value) => applyFilter({ date_from: value })} />
            <FilterDate label="Date To" value={filters.date_to} onChange={(value) => applyFilter({ date_to: value })} />
          </div>
        )}
      </div>

      <div className="overflow-hidden rounded-lg border bg-card">
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
              <TableRow>
                <TableCell colSpan={7} className="py-8 text-center text-muted-foreground">Loading work jobs...</TableCell>
              </TableRow>
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

function StatCard({ label, value, icon: Icon }: { label: string; value: number | string; icon: ComponentType<{ className?: string }> }) {
  return (
    <div className="flex items-center gap-3 rounded-lg border bg-card px-4 py-3">
      <div className="flex size-9 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
        <Icon className="size-4" />
      </div>
      <div>
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-lg font-semibold leading-tight">{value}</p>
      </div>
    </div>
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

function FilterDate({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return (
    <div className="space-y-1">
      <label className="text-xs font-medium text-muted-foreground">{label}</label>
      <Input type="date" className="h-9" value={value} onChange={(event) => onChange(event.target.value)} />
    </div>
  );
}
