"use client";

import { useCallback, useEffect, useState } from "react";

import AdminActivityLog from "@/components/admin-appointments/AdminActivityLog";
import AdminQuotationDetails from "@/components/admin-appointments/AdminQuotationDetails";
import CustomerLocationCard from "@/components/customer/shared/CustomerLocationCard";
import AdminWorkJobDetailsCard from "@/components/admin-work-jobs/AdminWorkJobDetailsCard";
import AdminWorkJobHeader from "@/components/admin-work-jobs/AdminWorkJobHeader";
import AdminWorkJobStatusActions from "@/components/admin-work-jobs/AdminWorkJobStatusActions";
import { fetchAdminWorkJob } from "@/features/admin-work-jobs/admin-work-job-api";
import type { AdminWorkJob } from "@/features/admin-work-jobs/types";
import { useRealtimeRefresh } from "@/hooks/use-realtime";

export default function AdminWorkJobShowPage({ workJobId }: { workJobId: string }) {
  const [workJob, setWorkJob] = useState<AdminWorkJob | null>(null);

  const reload = useCallback(() => {
    fetchAdminWorkJob(workJobId).then((response) => setWorkJob(response.data));
  }, [workJobId]);

  useEffect(() => {
    reload();
  }, [reload]);

  useRealtimeRefresh((payload) => {
    if (payload.id === Number(workJobId)) reload();
  }, ["work_job"]);

  if (!workJob) {
    return <p className="text-sm text-muted-foreground">Loading work job...</p>;
  }

  const quotationCanBeDownloaded = !["cancelled", "no_show"].includes(workJob.status);
  const quotationCanBeSigned = !["cancelled", "no_show", "completed"].includes(workJob.status);

  return (
    <div className="space-y-6">
      <AdminWorkJobHeader workJob={workJob} />
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <AdminWorkJobDetailsCard workJob={workJob} />
          <CustomerLocationCard address={workJob.address ?? ""} addressLat={workJob.address_lat} addressLng={workJob.address_lng} compact />
        </div>
        <div className="space-y-6">
          <AdminWorkJobStatusActions workJob={workJob} onUpdated={setWorkJob} />
          <AssignedWorkers workers={workJob.workers} />
          <AdminQuotationDetails
            quotation={workJob.quotation ?? null}
            canDownload={quotationCanBeDownloaded}
            canSign={quotationCanBeSigned}
          />
          <AdminActivityLog remarks={workJob.remarks} />
        </div>
      </div>
    </div>
  );
}

function AssignedWorkers({ workers }: { workers: AdminWorkJob["workers"] }) {
  return (
    <div className="rounded-lg border bg-card p-5 shadow-sm">
      <h2 className="text-xs font-semibold uppercase tracking-widest text-primary">Assigned Workers</h2>
      <div className="mt-4 space-y-2">
        {workers.length > 0 ? (
          workers.map((worker) => (
            <div key={worker.id} className="flex items-center gap-2 rounded-lg bg-muted/40 px-3 py-2 text-sm">
              <div className="flex size-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[10px] font-bold text-primary">
                {worker.full_name.charAt(0)}
              </div>
              {worker.full_name}
            </div>
          ))
        ) : (
          <p className="text-sm text-muted-foreground">No workers assigned.</p>
        )}
      </div>
    </div>
  );
}
