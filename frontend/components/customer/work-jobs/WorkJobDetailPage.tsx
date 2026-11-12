"use client";

import { customerRecordWaveClass } from "@/components/customer/shared/customer-surfaces";
import { useCallback, useEffect, useState } from "react";
import type { ComponentType } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { BriefcaseBusiness, CalendarDays, Clock, CreditCard, Factory, FileText, History, LayoutList, ShieldCheck, UserRoundCheck, Wrench } from "lucide-react";
import { Tabs } from "radix-ui";

import CustomerRecordTabs, { customerRecordTabPanelClass } from "@/components/customer/shared/CustomerRecordTabs";
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
import WorkJobProgress from "@/components/work-jobs/WorkJobProgress";
import WorkJobWarrantyCard from "@/components/work-jobs/WorkJobWarrantyCard";
import { getCustomerWorkJob } from "@/features/customer/customer-api";
import { formatCustomerDate, formatCustomerSchedule } from "@/features/customer/customer-utils";
import { CustomerStatus, statusIn } from "@/features/customer/status";
import type { CustomerWorkJob } from "@/features/customer/types";
import { affectsWorkJob } from "@/features/notifications/record-changes";
import { useRealtimeRefresh } from "@/hooks/use-realtime";
import { cn } from "@/lib/utils";

const workJobTabs = [
  { value: "overview", label: "Overview", icon: LayoutList },
  { value: "fabrication", label: "Fabrication", icon: Factory },
  { value: "quotation", label: "Quotation", icon: FileText },
  { value: "payments", label: "Payments", icon: CreditCard },
  { value: "aftercare", label: "Aftercare", icon: ShieldCheck },
  { value: "activity", label: "Activity", icon: History },
];

export default function WorkJobDetailPage({ workJobId }: { workJobId: string }) {
  const router = useRouter();
  const [workJob, setWorkJob] = useState<CustomerWorkJob | null>(null);

  const reload = useCallback(() => {
    getCustomerWorkJob(workJobId)
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
  const newestRemarks = [...workJob.remarks].sort(
    (a, b) => Date.parse(b.created_at) - Date.parse(a.created_at) || b.id - a.id,
  );

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
          <div className="flex min-w-0 flex-wrap items-center gap-x-3 gap-y-2">
            <h1 className="min-w-0 break-words text-2xl font-semibold tracking-tight sm:text-3xl">
              {workJob.work_job_number}
            </h1>
            <CustomerStatusBadge status={workJob.status} />
          </div>
          <p className="mt-1 text-sm text-muted-foreground">{workJob.full_name}</p>
        </div>
        <div className="flex min-w-0 flex-wrap items-center gap-3">
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

      <WorkJobProgress workJob={workJob} remarks={newestRemarks} />

      <Tabs.Root defaultValue="overview" key={workJob.id} className="mt-5 min-w-0">
        <CustomerRecordTabs label="Work job details" tabs={workJobTabs} />

        <Tabs.Content value="overview" className={customerRecordTabPanelClass}>
          <div className="grid min-w-0 gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(280px,340px)]">
            <div className="min-w-0 space-y-4">
              <WorkJobInfoCard workJob={workJob} />
              {workJob.appointment && <LinkedAppointmentCard workJob={workJob} />}
            </div>
            <CustomerActivityLog
              remarks={newestRemarks.slice(0, 3)}
              emptyDescription="Updates from this work job will appear here."
            />
          </div>
        </Tabs.Content>

        <Tabs.Content value="fabrication" className={customerRecordTabPanelClass}>
          <CustomerFabricationProgressCard workJob={workJob} />
        </Tabs.Content>

        <Tabs.Content value="quotation" className={customerRecordTabPanelClass}>
          <CustomerQuoteSummary
            quotation={quotation}
            signerName={workJob.full_name}
            canSign={quotationCanBeSigned}
            canDownload={quotationCanBeDownloaded}
            onSigned={reload}
          />
        </Tabs.Content>

        <Tabs.Content value="payments" className={customerRecordTabPanelClass}>
          <CustomerWorkJobPaymentCard workJob={workJob} onPaid={setWorkJob} />
        </Tabs.Content>

        <Tabs.Content value="aftercare" className={cn(customerRecordTabPanelClass, "space-y-4")}>
          {hasBackJobs && <CustomerWorkJobBackJobsCard workJob={workJob} />}
          <WorkJobWarrantyCard workJob={workJob} customer />
          <CustomerWorkJobRatingCard workJob={workJob} onSaved={setWorkJob} />
        </Tabs.Content>

        <Tabs.Content value="activity" className={customerRecordTabPanelClass}>
          <CustomerActivityLog
            remarks={newestRemarks}
            emptyDescription="Updates from this work job will appear here."
          />
        </Tabs.Content>
      </Tabs.Root>
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
    <div className={`min-w-0 w-full max-w-full rounded-xl border bg-card p-4 sm:p-5 ${customerRecordWaveClass}`}>
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
    <section className={`min-w-0 w-full max-w-full rounded-xl border bg-card p-4 sm:p-5 ${customerRecordWaveClass}`}>
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
