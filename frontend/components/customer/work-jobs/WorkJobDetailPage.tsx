"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import CustomerLocationCard from "@/components/customer/shared/CustomerLocationCard";
import CustomerProgress from "@/components/customer/shared/CustomerProgress";
import CustomerQuoteSummary from "@/components/customer/shared/CustomerQuoteSummary";
import CustomerShell from "@/components/customer/shared/CustomerShell";
import CustomerStatusBadge from "@/components/customer/shared/CustomerStatusBadge";
import { getCustomerWorkJob } from "@/features/customer/customer-api";
import { formatCustomerSchedule } from "@/features/customer/customer-utils";
import type { CustomerWorkJob } from "@/features/customer/types";

export default function WorkJobDetailPage({ workJobId }: { workJobId: string }) {
  const router = useRouter();
  const [workJob, setWorkJob] = useState<CustomerWorkJob | null>(null);

  useEffect(() => {
    getCustomerWorkJob(workJobId).then((response) => setWorkJob(response.data));
  }, [workJobId]);

  if (!workJob) {
    return (
      <CustomerShell>
        <p className="text-sm text-slate-500">Loading work job...</p>
      </CustomerShell>
    );
  }

  const quotation = workJob.quotation ?? workJob.appointment?.quotation;

  return (
    <CustomerShell>
      <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <button onClick={() => router.back()} className="mb-3 text-sm font-bold text-primary hover:underline">
            Back
          </button>
          <p className="text-xs font-bold uppercase tracking-widest text-slate-400">
            {workJob.work_job_number}
          </p>
          <h1 className="mt-1 text-3xl font-black text-slate-950">Work Job Details</h1>
        </div>
        <CustomerStatusBadge status={workJob.status} />
      </div>

      <div className="grid gap-5 lg:grid-cols-[1fr_360px]">
        <section className="space-y-5">
          <CustomerProgress
            status={workJob.status}
            type="work_job"
            reference={workJob.work_job_number}
            createdAt={workJob.created_at}
            scheduledDate={workJob.scheduled_date}
            timeFrom={workJob.scheduled_time_from}
            timeUntil={workJob.scheduled_time_until}
            remarks={workJob.remarks}
          />

          <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="mb-4 text-lg font-black text-slate-950">Schedule</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <Info label="Scheduled Date" value={formatCustomerSchedule(workJob.scheduled_date, workJob.scheduled_time_from, workJob.scheduled_time_until)} />
              <Info label="Service Type" value={workJob.service_type === "other" ? workJob.service_type_other ?? "Other" : workJob.service_type} />
              <Info label="Assigned Workers" value={workJob.workers.length ? workJob.workers.map((worker) => worker.full_name).join(", ") : "Pending"} wide />
            </div>
            {workJob.notes && (
              <div className="mt-4 rounded-lg bg-slate-50 p-3 text-sm text-slate-600">
                {workJob.notes}
              </div>
            )}
          </div>

          <CustomerLocationCard
            address={workJob.address}
            addressLat={workJob.address_lat}
            addressLng={workJob.address_lng}
          />

          <CustomerQuoteSummary quotation={quotation} />
        </section>

        <aside className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm font-black text-slate-950">Work Job Rules</p>
          <p className="mt-2 text-sm leading-6 text-slate-500">
            Work jobs are managed by the SOG team. Customers can track progress and view quote details here,
            but creation and status changes are handled internally.
          </p>
        </aside>
      </div>
    </CustomerShell>
  );
}

function Info({ label, value, wide }: { label: string; value: string; wide?: boolean }) {
  return (
    <div className={wide ? "sm:col-span-2" : ""}>
      <p className="text-xs font-bold uppercase tracking-wide text-slate-400">{label}</p>
      <p className="mt-1 text-sm font-semibold text-slate-800">{value}</p>
    </div>
  );
}
