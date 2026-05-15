"use client";

import { useCallback, useEffect, useState } from "react";

import CustomerShell from "@/components/customer/shared/CustomerShell";
import WorkJobCard from "@/components/customer/work-jobs/WorkJobCard";
import { getCustomerWorkJobs } from "@/features/customer/customer-api";
import type { CustomerWorkJob } from "@/features/customer/types";
import { useRealtimeRefresh } from "@/hooks/use-realtime";

export default function WorkJobsPage() {
  const [workJobs, setWorkJobs] = useState<CustomerWorkJob[]>([]);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(() => {
    getCustomerWorkJobs()
      .then((response) => setWorkJobs(response.data))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  useRealtimeRefresh(() => {
    setLoading(true);
    reload();
  }, ["work_job"]);

  return (
    <CustomerShell>
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
    </CustomerShell>
  );
}
