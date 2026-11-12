"use client";

import { useCallback, useEffect, useState } from "react";

import AdminDetailTabs from "@/components/admin/AdminDetailTabs";
import AdminActivityLog from "@/components/admin-appointments/AdminActivityLog";
import AdminQuotationDetails from "@/components/admin-appointments/AdminQuotationDetails";
import CustomerLocationCard from "@/components/customer/shared/CustomerLocationCard";
import AdminWorkJobBackJobsCard from "@/components/admin-work-jobs/AdminWorkJobBackJobsCard";
import AdminWorkJobChargesCard from "@/components/admin-work-jobs/AdminWorkJobChargesCard";
import AdminWorkJobDetailsCard from "@/components/admin-work-jobs/AdminWorkJobDetailsCard";
import AdminWorkJobFabricationCard from "@/components/admin-work-jobs/AdminWorkJobFabricationCard";
import AdminWorkJobHeader from "@/components/admin-work-jobs/AdminWorkJobHeader";
import AdminWorkJobPaymentsCard from "@/components/admin-work-jobs/AdminWorkJobPaymentsCard";
import AdminWorkJobRatingCard from "@/components/admin-work-jobs/AdminWorkJobRatingCard";
import AdminWorkJobStatusActions from "@/components/admin-work-jobs/AdminWorkJobStatusActions";
import WorkJobProgress from "@/components/work-jobs/WorkJobProgress";
import WorkJobWarrantyCard from "@/components/work-jobs/WorkJobWarrantyCard";
import { DetailPageSkeleton } from "@/components/ui/page-skeletons";
import { hasRole } from "@/features/auth/current-user-api";
import { fetchAdminWorkJob } from "@/features/admin-work-jobs/admin-work-job-api";
import { CustomerStatus } from "@/features/customer/status";
import type { AdminWorkJob } from "@/features/admin-work-jobs/types";
import { useCurrentUser } from "@/hooks/use-current-user";
import { affectsWorkJob } from "@/features/notifications/record-changes";
import { useRealtimeRefresh } from "@/hooks/use-realtime";

export default function AdminWorkJobShowPage({ workJobId }: { workJobId: string }) {
  const { user } = useCurrentUser();
  const [workJob, setWorkJob] = useState<AdminWorkJob | null>(null);

  const reload = useCallback(() => {
    fetchAdminWorkJob(workJobId)
      .then((response) => setWorkJob(response.data))
      .catch(() => { /* Keep the last successful snapshot. */ });
  }, [workJobId]);

  useEffect(() => {
    reload();
  }, [reload]);

  useRealtimeRefresh((payload) => {
    if (affectsWorkJob(payload, Number(workJobId), workJob)) reload();
  }, ["appointment", "quotation", "work_job"]);

  if (!workJob) {
    return <DetailPageSkeleton />;
  }

  const quotationCanBeDownloaded = ![CustomerStatus.Cancelled, CustomerStatus.NoShow].includes(workJob.status);
  const quotationCanBeSigned = ![
    CustomerStatus.Cancelled,
    CustomerStatus.NoShow,
    CustomerStatus.Completed,
  ].includes(workJob.status);
  const isWorker = hasRole(user, "staff");
  const newestRemarks = [...workJob.remarks].sort(
    (a, b) => Date.parse(b.created_at) - Date.parse(a.created_at) || b.id - a.id,
  );

  return (
    <div className="space-y-6">
      <AdminWorkJobHeader workJob={workJob} />
      <AdminDetailTabs
        label="Work job details"
        tabs={[
          {
            value: "overview",
            label: "Overview",
            content: (
              <>
                <WorkJobProgress workJob={workJob} remarks={newestRemarks} showStatusLabel={false} />
                <div className="grid items-start gap-6 lg:grid-cols-2">
                  <div className="space-y-4">
                    <AdminWorkJobDetailsCard workJob={workJob} />
                    <AssignedWorkers workers={workJob.workers} />
                  </div>
                  <CustomerLocationCard
                    address={workJob.address ?? ""}
                    addressLat={workJob.address_lat}
                    addressLng={workJob.address_lng}
                    compact
                  />
                </div>
              </>
            ),
          },
          {
            value: "fabrication",
            label: "Fabrication",
            content: <AdminWorkJobFabricationCard workJob={workJob} onUpdated={setWorkJob} canManage />,
          },
          {
            value: "status",
            label: "Status",
            content: <AdminWorkJobStatusActions workJob={workJob} onUpdated={setWorkJob} />,
          },
          {
            value: "quotation",
            label: "Quotation",
            content: (
              <AdminQuotationDetails
                quotation={workJob.quotation ?? null}
                canDownload={quotationCanBeDownloaded}
                canSign={quotationCanBeSigned}
                collapsible={false}
              />
            ),
          },
          {
            value: "billing",
            label: "Billing",
            content: (
              <>
                <AdminWorkJobChargesCard workJob={workJob} onUpdated={setWorkJob} />
                <AdminWorkJobPaymentsCard workJob={workJob} onUpdated={setWorkJob} />
              </>
            ),
          },
          {
            value: "warranty",
            label: "Warranty",
            content: <WorkJobWarrantyCard workJob={workJob} />,
          },
          {
            value: "back-jobs",
            label: "Back Jobs",
            content: <AdminWorkJobBackJobsCard workJob={workJob} onUpdated={setWorkJob} canCreate={!isWorker} />,
          },
          {
            value: "satisfaction",
            label: "Customer Satisfaction",
            content: <AdminWorkJobRatingCard workJob={workJob} />,
          },
          {
            value: "activity",
            label: "Activity",
            content: <AdminActivityLog remarks={workJob.remarks} />,
          },
        ]}
      />
    </div>
  );
}

function AssignedWorkers({ workers }: { workers: AdminWorkJob["workers"] }) {
  return (
    <div className="rounded-lg border bg-card p-5 shadow-sm">
      <h2 className="text-xs font-semibold uppercase tracking-widest text-primary">Assigned Staff</h2>
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
          <p className="text-sm text-muted-foreground">No staff assigned.</p>
        )}
      </div>
    </div>
  );
}
