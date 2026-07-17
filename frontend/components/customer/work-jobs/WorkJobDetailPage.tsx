"use client";

import { useCallback, useEffect, useState } from "react";
import type { ComponentType } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { BriefcaseBusiness, CalendarDays, Clock, FileText, UserRoundCheck, Wrench } from "lucide-react";

import CustomerActivityLog from "@/components/customer/shared/CustomerActivityLog";
import CustomerContactLocationSheet from "@/components/customer/shared/CustomerContactLocationSheet";
import CustomerQuoteSummary from "@/components/customer/shared/CustomerQuoteSummary";
import CustomerStatusBadge from "@/components/customer/shared/CustomerStatusBadge";
import CustomerWorkJobBackJobsCard from "@/components/customer/work-jobs/CustomerWorkJobBackJobsCard";
import CustomerFabricationProgressCard from "@/components/customer/work-jobs/CustomerFabricationProgressCard";
import CustomerWorkJobPaymentCard from "@/components/customer/work-jobs/CustomerWorkJobPaymentCard";
import CustomerWorkJobRatingCard from "@/components/customer/work-jobs/CustomerWorkJobRatingCard";
import { Button } from "@/components/ui/button";
import { DetailPageSkeleton } from "@/components/ui/page-skeletons";
import WorkJobWarrantyCard from "@/components/work-jobs/WorkJobWarrantyCard";
import { getCustomerWorkJob } from "@/features/customer/customer-api";
import { formatCustomerDate, formatCustomerSchedule } from "@/features/customer/customer-utils";
import { CustomerStatus, statusIn } from "@/features/customer/status";
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
    return <DetailPageSkeleton customer />;
  }

  const quotation = workJob.quotation ?? workJob.appointment?.quotation;
  const quotationCanBeSigned =
    !statusIn(workJob.status, [CustomerStatus.Cancelled, CustomerStatus.NoShow, CustomerStatus.Completed]) &&
    !statusIn(workJob.appointment?.status, [CustomerStatus.Cancelled, CustomerStatus.NoShow, CustomerStatus.Completed]);
  const quotationCanBeDownloaded =
    !statusIn(workJob.status, [CustomerStatus.Cancelled, CustomerStatus.NoShow]) &&
    !statusIn(workJob.appointment?.status, [CustomerStatus.Cancelled, CustomerStatus.NoShow]);

  return (
    <>
      <div className="relative mb-6 flex flex-col gap-6 overflow-hidden rounded-[1.75rem] bg-[#162d4a] px-5 py-8 text-white sm:px-8 lg:flex-row lg:items-end lg:justify-between lg:px-10">
        <div className="absolute -right-20 -top-24 h-64 w-64 rounded-full bg-[#608db9]/25 blur-3xl" />
        <div>
          <button
            onClick={() => router.back()}
            className="relative mb-4 text-xs font-semibold text-white/55 hover:text-white"
          >
            Back
          </button>
          <p className="relative text-[10px] font-bold uppercase tracking-[0.2em] text-[#c8dae8]">
            {workJob.work_job_number}
          </p>
          <h1 className="relative mt-2 text-3xl font-medium tracking-[-0.04em] text-white sm:text-4xl">
            Work job details
          </h1>
        </div>
        <div className="relative flex flex-wrap items-center gap-3">
          <CustomerStatusBadge status={workJob.status} />
          <CustomerContactLocationSheet
            fullName={workJob.full_name}
            phoneNumber={workJob.phone_number}
            email={workJob.email}
            address={workJob.address}
            addressLat={workJob.address_lat}
            addressLng={workJob.address_lng}
          />
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-[1fr_360px]">
        <section className="space-y-5">
          {workJob.appointment && <LinkedAppointmentCard workJob={workJob} />}
          <CustomerWorkJobBackJobsCard workJob={workJob} />

          <CustomerFabricationProgressCard workJob={workJob} />

          <WorkJobInfoCard workJob={workJob} />

          {/* <CustomerQuoteImageList quotation={quotation} /> */}
          <WorkJobWarrantyCard workJob={workJob} customer />

          <CustomerWorkJobRatingCard workJob={workJob} onSaved={setWorkJob} />
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
    <div className="rounded-[1.5rem] border border-[#dce4ea] bg-white p-5 shadow-[0_18px_60px_rgba(22,45,74,0.06)]">
      <h2 className="mb-5 text-xs font-semibold uppercase tracking-widest text-primary">
        Schedule &amp; Service Details
      </h2>
      <div className="grid gap-4 sm:grid-cols-2">
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
    <section className="rounded-[1.5rem] border border-[#dce4ea] bg-white p-5 shadow-[0_18px_60px_rgba(22,45,74,0.06)]">
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
