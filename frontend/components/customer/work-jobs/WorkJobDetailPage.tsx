"use client";

import { useCallback, useEffect, useState } from "react";
import type { ComponentType } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { BriefcaseBusiness, CalendarDays, Clock, FileText, UserRoundCheck, Wrench } from "lucide-react";

import CustomerActivityLog from "@/components/customer/shared/CustomerActivityLog";
import CustomerContactLocationSheet from "@/components/customer/shared/CustomerContactLocationSheet";
import CustomerDetailAccordion from "@/components/customer/shared/CustomerDetailAccordion";
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
  const hasBackJobs = Boolean(workJob.parent_work_job || workJob.back_jobs?.length);

  return (
    <>
      <div className="mb-6 flex min-w-0 w-full max-w-full flex-col gap-4 py-1 lg:flex-row lg:items-end lg:justify-between">
        <div className="min-w-0">
          <button
            onClick={() => router.back()}
            className="mb-4 text-xs font-medium text-muted-foreground hover:text-foreground"
          >
            Back
          </button>
          <h1 className="text-2xl font-semibold tracking-tight">
            Work job details
          </h1>
          <p className="mt-1 break-all text-sm text-muted-foreground">{workJob.work_job_number}</p>
        </div>
        <div className="flex min-w-0 flex-wrap items-center gap-3">
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

      <div className="grid min-w-0 w-full max-w-full gap-5 lg:grid-cols-[minmax(0,1fr)_360px]">
        <section className="min-w-0 space-y-5">
          {workJob.appointment && <LinkedAppointmentCard workJob={workJob} />}
          <WorkJobInfoCard workJob={workJob} />
        </section>

        <aside className="min-w-0 space-y-4">
          <CustomerDetailAccordion title="Fabrication progress">
            <CustomerFabricationProgressCard workJob={workJob} />
          </CustomerDetailAccordion>

          {hasBackJobs && <CustomerDetailAccordion title="Back job updates">
            <CustomerWorkJobBackJobsCard workJob={workJob} />
          </CustomerDetailAccordion>}

          <CustomerDetailAccordion title="Warranty record">
            <WorkJobWarrantyCard workJob={workJob} customer />
          </CustomerDetailAccordion>

          <CustomerDetailAccordion title="Customer satisfaction">
            <CustomerWorkJobRatingCard workJob={workJob} onSaved={setWorkJob} />
          </CustomerDetailAccordion>

          <CustomerDetailAccordion title="Payments">
            <CustomerWorkJobPaymentCard workJob={workJob} onPaid={setWorkJob} />
          </CustomerDetailAccordion>

          <CustomerDetailAccordion title="Quotation">
            <CustomerQuoteSummary
              quotation={quotation}
              signerName={workJob.full_name}
              canSign={quotationCanBeSigned}
              canDownload={quotationCanBeDownloaded}
              onSigned={reload}
            />
          </CustomerDetailAccordion>

          <CustomerDetailAccordion title="Activity log">
            <CustomerActivityLog
              remarks={workJob.remarks}
              emptyDescription="Updates from this work job will appear here."
            />
          </CustomerDetailAccordion>
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
    <div className="min-w-0 w-full max-w-full overflow-hidden rounded-xl border bg-card p-4 shadow-sm sm:p-5">
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
        <Info icon={UserRoundCheck} label="Assigned Staff" value={workers} wide />
        {workJob.notes && <Info icon={FileText} label="Notes" value={workJob.notes} wide />}
      </div>
    </div>
  );
}

function LinkedAppointmentCard({ workJob }: { workJob: CustomerWorkJob }) {
  if (!workJob.appointment) return null;

  return (
    <section className="min-w-0 w-full max-w-full overflow-hidden rounded-xl border bg-card p-4 shadow-sm sm:p-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <BriefcaseBusiness className="size-4 text-primary" />
            <h2 className="text-xs font-semibold uppercase tracking-widest text-primary">
              Linked Appointment
            </h2>
          </div>
          <p className="mt-2 break-all text-sm font-medium text-slate-950">
            {workJob.appointment.appointment_number}
          </p>
        </div>
        <Button asChild type="button" variant="outline" size="sm" className="w-full sm:w-auto">
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
      <p className="mt-1 break-words text-sm font-normal leading-relaxed text-slate-950">{value}</p>
    </div>
  );
}
