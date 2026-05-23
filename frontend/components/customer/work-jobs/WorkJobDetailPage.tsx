"use client";

import { useCallback, useEffect, useState } from "react";
import type { ComponentType } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { BriefcaseBusiness, CalendarDays, Clock, FileText, Mail, Phone, User, UserRoundCheck, Wrench } from "lucide-react";

import CustomerActivityLog from "@/components/customer/shared/CustomerActivityLog";
import CustomerLocationCard from "@/components/customer/shared/CustomerLocationCard";
import CustomerQuoteImageList from "@/components/customer/shared/CustomerQuoteImageList";
import CustomerQuoteSummary from "@/components/customer/shared/CustomerQuoteSummary";
import CustomerStatusBadge from "@/components/customer/shared/CustomerStatusBadge";
import CustomerWorkJobBackJobsCard from "@/components/customer/work-jobs/CustomerWorkJobBackJobsCard";
import CustomerWorkJobPaymentCard from "@/components/customer/work-jobs/CustomerWorkJobPaymentCard";
import { Button } from "@/components/ui/button";
import { getCustomerWorkJob } from "@/features/customer/customer-api";
import { formatCustomerDate, formatCustomerSchedule } from "@/features/customer/customer-utils";
import type { CustomerWorkJob } from "@/features/customer/types";
import { useRealtimeRefresh } from "@/hooks/use-realtime";

export default function WorkJobDetailPage({ workJobId }: { workJobId: string }) {
  const router = useRouter();
  const [workJob, setWorkJob] = useState<CustomerWorkJob | null>(null);

  const reload = useCallback(() => {
    getCustomerWorkJob(workJobId).then((response) => setWorkJob(response.data));
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
    return (
      <>
        <p className="text-sm text-slate-500">Loading work job...</p>
      </>
    );
  }

  const quotation = workJob.quotation ?? workJob.appointment?.quotation;
  const quotationCanBeSigned =
    !["cancelled", "no_show", "completed"].includes(workJob.status) &&
    !["cancelled", "no_show", "completed"].includes(workJob.appointment?.status ?? "");
  const quotationCanBeDownloaded =
    !["cancelled", "no_show"].includes(workJob.status) &&
    !["cancelled", "no_show"].includes(workJob.appointment?.status ?? "");

  return (
    <>
      <div className="mb-5 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <button
            onClick={() => router.back()}
            className="mb-3 text-sm font-medium text-primary hover:underline"
          >
            Back
          </button>
          <p className="text-[11px] font-semibold uppercase tracking-widest text-primary">
            {workJob.work_job_number}
          </p>
          <h1 className="mt-1 text-sm font-medium text-slate-950">
            {workJob.full_name}
          </h1>
        </div>
        <CustomerStatusBadge status={workJob.status} />
      </div>

      <div className="grid gap-5 lg:grid-cols-[1fr_360px]">
        <section className="space-y-5">
          {workJob.appointment && <LinkedAppointmentCard workJob={workJob} />}
          <CustomerWorkJobBackJobsCard workJob={workJob} />
          
          <WorkJobInfoCard workJob={workJob} />

          <CustomerLocationCard
            address={workJob.address}
            addressLat={workJob.address_lat}
            addressLng={workJob.address_lng}
            compact
          />

          <CustomerQuoteImageList quotation={quotation} />
        </section>

        <aside className="space-y-4">
          <CustomerWorkJobPaymentCard workJob={workJob} onPaid={setWorkJob} />

          <CustomerQuoteSummary
            quotation={quotation}
            signerName={workJob.full_name}
            canSign={quotationCanBeSigned}
            canDownload={quotationCanBeDownloaded}
            onSigned={reload}
          />

          <CustomerActivityLog
            remarks={workJob.remarks}
            emptyDescription="Updates from this work job will appear here."
          />
        </aside>
      </div>
    </>
  );
}

function WorkJobInfoCard({ workJob }: { workJob: CustomerWorkJob }) {
  const serviceType =
    workJob.service_type === "other"
      ? workJob.service_type_other ?? "Other"
      : workJob.service_type;
  const workers = workJob.workers.length
    ? workJob.workers.map((worker) => worker.full_name).join(", ")
    : "Pending assignment";

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <h2 className="mb-5 text-xs font-semibold uppercase tracking-widest text-primary">
        Work Job Details
      </h2>
      <div className="grid gap-4 sm:grid-cols-2">
        <Info icon={User} label="Customer" value={workJob.full_name} />
        <Info icon={Phone} label="Phone" value={workJob.phone_number} />
        <Info icon={Mail} label="Email" value={workJob.email ?? "-"} />
        <Info icon={Wrench} label="Service Type" value={serviceType} />
        <Info
          icon={CalendarDays}
          label="Scheduled Date"
          value={workJob.scheduled_date ? formatCustomerDate(workJob.scheduled_date) : "-"}
        />
        <Info
          icon={Clock}
          label="Scheduled Time"
          value={formatCustomerSchedule(
            workJob.scheduled_date,
            workJob.scheduled_time_from,
            workJob.scheduled_time_until,
          )}
        />
        <Info icon={UserRoundCheck} label="Assigned Workers" value={workers} wide />
        {workJob.notes && <Info icon={FileText} label="Notes" value={workJob.notes} wide />}
      </div>
    </div>
  );
}

function LinkedAppointmentCard({ workJob }: { workJob: CustomerWorkJob }) {
  if (!workJob.appointment) return null;

  return (
    <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <BriefcaseBusiness className="size-4 text-primary" />
            <h2 className="text-xs font-semibold uppercase tracking-widest text-primary">
              Linked Appointment
            </h2>
          </div>
          <p className="mt-2 text-sm font-medium text-slate-950">
            {workJob.appointment.appointment_number}
          </p>
        </div>
        <Button asChild type="button" variant="outline" size="sm">
          <Link href={`/account/appointments/${workJob.appointment.id}`}>View Appointment</Link>
        </Button>
      </div>
    </section>
  );
}

function Info({
  icon: Icon,
  label,
  value,
  wide,
}: {
  icon: ComponentType<{ className?: string }>;
  label: string;
  value: string;
  wide?: boolean;
}) {
  return (
    <div className={wide ? "md:col-span-2" : ""}>
      <div className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
        <Icon className="size-3.5 text-slate-500" />
        {label}
      </div>
      <p className="mt-1 text-sm font-normal leading-relaxed text-slate-950">{value}</p>
    </div>
  );
}
