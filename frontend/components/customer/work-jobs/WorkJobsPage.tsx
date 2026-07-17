"use client";

import { useCallback, useEffect, useState } from "react";

import WorkJobCard from "@/components/customer/work-jobs/WorkJobCard";
import CustomerPageHeader from "@/components/customer/shared/CustomerPageHeader";
import { Button } from "@/components/ui/button";
import { CustomerCardGridSkeleton } from "@/components/ui/page-skeletons";
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
    void Promise.resolve().then(reload);
  }, [reload]);

  useRealtimeRefresh(() => {
    reload();
  }, ["work_job"]);

  return (
    <>
      <CustomerPageHeader
        eyebrow="Work Jobs"
        title="Installation in motion."
        description="Follow scheduled installations, assigned teams, service progress, payments, and completion updates in one place."
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {loading ? (
          <CustomerCardGridSkeleton />
        ) : (
          workJobs.map((workJob) => (
            <WorkJobCard key={workJob.id} workJob={workJob} />
          ))
        )}
      </div>

      {!loading && workJobs.length === 0 && (
        <div className="rounded-[1.5rem] border border-dashed border-[#cbd6de] bg-white p-12 text-center">
          <p className="text-lg font-medium text-[#101820]">No work jobs yet</p>
          <p className="mt-2 text-sm text-[#667584]">
            Your work jobs will appear here when our team schedules installation or service.
          </p>
        </div>
      )}

      {meta && meta.last_page > 1 && (
        <div className="mt-6 flex flex-wrap items-center justify-end gap-3 rounded-full bg-white p-2">
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
