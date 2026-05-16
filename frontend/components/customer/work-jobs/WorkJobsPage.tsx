"use client";

import { useCallback, useEffect, useState } from "react";

import WorkJobCard from "@/components/customer/work-jobs/WorkJobCard";
import { Button } from "@/components/ui/button";
import { getCustomerWorkJobs } from "@/features/customer/customer-api";
import type { CustomerWorkJob } from "@/features/customer/types";
import type { PaginatedResponse } from "@/features/products/types";
import { useRealtimeRefresh } from "@/hooks/use-realtime";

export default function WorkJobsPage() {
  const [workJobs, setWorkJobs] = useState<CustomerWorkJob[]>([]);
  const [meta, setMeta] = useState<PaginatedResponse<CustomerWorkJob>["meta"]>(undefined);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(() => {
    setLoading(true);
    getCustomerWorkJobs({ page, per_page: 9 })
      .then((response) => {
        setWorkJobs(response.data);
        setMeta(response.meta);
      })
      .finally(() => setLoading(false));
  }, [page]);

  useEffect(() => {
    reload();
  }, [reload]);

  useRealtimeRefresh(() => {
    setLoading(true);
    reload();
  }, ["work_job"]);

  return (
    <>
      <div className="mb-6">
        <p className="text-xs font-semibold uppercase tracking-widest text-primary">Work Jobs</p>
        <h1 className="mt-2 text-base font-medium text-slate-950">Installation and service jobs</h1>
        <p className="mt-1 text-sm text-slate-500">
          Work jobs are created by the SOG team after your appointment or quote is approved.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {workJobs.map((workJob) => (
          <WorkJobCard key={workJob.id} workJob={workJob} />
        ))}
      </div>

      {!loading && workJobs.length === 0 && (
        <div className="rounded-lg border border-dashed border-slate-200 bg-white p-10 text-center">
          <p className="font-medium text-slate-900">No work jobs yet</p>
          <p className="mt-1 text-sm text-slate-500">
            Your work jobs will appear here when our team schedules installation or service.
          </p>
        </div>
      )}

      {meta && meta.last_page > 1 && (
        <div className="mt-5 flex items-center justify-end gap-3">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={meta.current_page <= 1 || loading}
            onClick={() => setPage((value) => Math.max(1, value - 1))}
          >
            Previous
          </Button>
          <span className="text-sm text-slate-500">
            Page {meta.current_page} of {meta.last_page}
          </span>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={meta.current_page >= meta.last_page || loading}
            onClick={() => setPage((value) => value + 1)}
          >
            Next
          </Button>
        </div>
      )}
    </>
  );
}
