"use client";

import { useCallback, useEffect, useState } from "react";
import type { ReactNode } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";

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
import WorkJobWarrantyCard from "@/components/work-jobs/WorkJobWarrantyCard";
import { DetailPageSkeleton } from "@/components/ui/page-skeletons";
import { hasRole } from "@/features/auth/current-user-api";
import { fetchAdminWorkJob } from "@/features/admin-work-jobs/admin-work-job-api";
import { CustomerStatus } from "@/features/customer/status";
import type { AdminWorkJob } from "@/features/admin-work-jobs/types";
import { useCurrentUser } from "@/hooks/use-current-user";
import { useRealtimeRefresh } from "@/hooks/use-realtime";

export default function AdminWorkJobShowPage({ workJobId }: { workJobId: string }) {
  const { user } = useCurrentUser();
  const [workJob, setWorkJob] = useState<AdminWorkJob | null>(null);

  const reload = useCallback(() => {
    fetchAdminWorkJob(workJobId).then((response) => setWorkJob(response.data));
  }, [workJobId]);

  useEffect(() => {
    reload();
  }, [reload]);

  useRealtimeRefresh((payload) => {
    if (
      payload.id === Number(workJobId) ||
      payload.parent_work_job_id === Number(workJobId)
    ) {
      reload();
    }
  }, ["work_job"]);

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
  const canUpdateStatus = [
    CustomerStatus.Pending,
    CustomerStatus.Confirmed,
    CustomerStatus.Rescheduled,
    CustomerStatus.OnTheWay,
    CustomerStatus.InProgress,
    CustomerStatus.Cancelled,
  ].includes(workJob.status);

  return (
    <div className="space-y-6">
      <AdminWorkJobHeader workJob={workJob} />
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <AdminWorkJobDetailsCard workJob={workJob} />
          <CustomerLocationCard address={workJob.address ?? ""} addressLat={workJob.address_lat} addressLng={workJob.address_lng} compact />
        </div>
        <aside className="space-y-4">
          <WorkJobDetailAccordion title="Fabrication progress">
            <AdminWorkJobFabricationCard workJob={workJob} onUpdated={setWorkJob} canManage />
          </WorkJobDetailAccordion>
          {canUpdateStatus && <WorkJobDetailAccordion title="Update status">
            <AdminWorkJobStatusActions workJob={workJob} onUpdated={setWorkJob} />
          </WorkJobDetailAccordion>}
          <WorkJobDetailAccordion title="Back jobs">
            <AdminWorkJobBackJobsCard workJob={workJob} onUpdated={setWorkJob} canCreate={!isWorker} />
          </WorkJobDetailAccordion>
          <WorkJobDetailAccordion title="Charges">
            <AdminWorkJobChargesCard workJob={workJob} onUpdated={setWorkJob} />
          </WorkJobDetailAccordion>
          <WorkJobDetailAccordion title="Payments">
            <AdminWorkJobPaymentsCard workJob={workJob} onUpdated={setWorkJob} />
          </WorkJobDetailAccordion>
          <WorkJobDetailAccordion title="Warranty record">
            <WorkJobWarrantyCard workJob={workJob} />
          </WorkJobDetailAccordion>
          <WorkJobDetailAccordion title="Customer satisfaction">
            <AdminWorkJobRatingCard workJob={workJob} />
          </WorkJobDetailAccordion>
          <WorkJobDetailAccordion title="Assigned staff">
            <AssignedWorkers workers={workJob.workers} />
          </WorkJobDetailAccordion>
          <AdminQuotationDetails
            quotation={workJob.quotation ?? null}
            canDownload={quotationCanBeDownloaded}
            canSign={quotationCanBeSigned}
          />
          <AdminActivityLog remarks={workJob.remarks} />
        </aside>
      </div>
    </div>
  );
}

function WorkJobDetailAccordion({ title, children }: { title: string; children: ReactNode }) {
  const [open, setOpen] = useState(false);

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex w-full items-center justify-between gap-3 rounded-lg border bg-card p-5 text-left shadow-sm transition-colors hover:bg-muted/30"
        aria-expanded="false"
      >
        <span className="text-xs font-semibold uppercase tracking-widest text-primary">{title}</span>
        <ChevronDown className="size-4 shrink-0" />
      </button>
    );
  }

  return (
    <section className="relative">
      {children}
      <button
        type="button"
        onClick={() => setOpen(false)}
        className="absolute -right-2 -top-2 z-20 flex size-7 items-center justify-center rounded-full border bg-white text-foreground shadow-sm transition-colors hover:bg-muted"
        aria-expanded="true"
        aria-label={`Collapse ${title}`}
      >
        <ChevronUp className="size-4" />
      </button>
    </section>
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
