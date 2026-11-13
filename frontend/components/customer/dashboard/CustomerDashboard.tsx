"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRight, CalendarCheck, CalendarPlus, Clock, Wrench } from "lucide-react";

import AppointmentCard from "@/components/customer/appointments/AppointmentCard";
import { customerPanelClass } from "@/components/customer/shared/customer-surfaces";
import WorkJobCard from "@/components/customer/work-jobs/WorkJobCard";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { CustomerCardGridSkeleton } from "@/components/ui/page-skeletons";
import AdminSummaryCard from "@/components/admin/AdminSummaryCard";
import {
  getCustomerAppointments,
  getCustomerWorkJobs,
} from "@/features/customer/customer-api";
import { isActiveAppointment, isActiveWorkJob } from "@/features/customer/customer-utils";
import type { CustomerAppointment, CustomerWorkJob } from "@/features/customer/types";
import { useRealtimeRefresh } from "@/hooks/use-realtime";

export default function CustomerDashboard() {
  const [appointments, setAppointments] = useState<CustomerAppointment[]>([]);
  const [workJobs, setWorkJobs] = useState<CustomerWorkJob[]>([]);
  const [loading, setLoading] = useState(true);

  const loadRecords = useCallback(() => {
    return Promise.all([
      getCustomerAppointments({ per_page: 20 }),
      getCustomerWorkJobs({ per_page: 20 }),
    ])
      .then(([appointmentResponse, workJobResponse]) => {
        setAppointments(appointmentResponse.data);
        setWorkJobs(workJobResponse.data);
      })
      .catch(() => { /* Keep the last successful snapshot. */ })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    void loadRecords();
  }, [loadRecords]);

  useRealtimeRefresh(() => {
    void loadRecords();
  }, ["appointment", "work_job", "quotation"]);

  const stats = useMemo(
    () => [
      {
        label: "Pending Appointments",
        value: appointments.filter((item) => item.status === "pending").length,
        icon: CalendarPlus,
        description: "awaiting schedule confirmation",
        tooltip: "Requests waiting for the SOG team to confirm the schedule.",
      },
      {
        label: "Active Appointments",
        value: appointments.filter((item) => item.status !== "pending" && isActiveAppointment(item)).length,
        icon: Clock,
        description: "appointments in progress",
        tooltip: "Appointments still moving through inspection, quotation, or scheduling.",
      },
      {
        label: "Completed Appointments",
        value: appointments.filter((item) => item.status === "completed").length,
        icon: CalendarCheck,
        description: "appointments completed",
        tooltip: "Appointments that have been marked completed.",
      },
      {
        label: "Active Work Jobs",
        value: workJobs.filter(isActiveWorkJob).length,
        icon: Wrench,
        description: "scheduled or active jobs",
        tooltip: "Installation or service jobs that are scheduled or in progress.",
      },
    ],
    [appointments, workJobs],
  );

  return (
    <>
      <section className="py-1">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Welcome back</h1>
            <p className="mt-1 max-w-xl text-sm text-muted-foreground">
              Manage your inspections and installation progress from one place.
            </p>
          </div>
          <Link
            href="/account/appointments/new"
            className="group inline-flex h-9 w-fit items-center justify-center gap-2 rounded-full bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            New appointment
            <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
          </Link>
        </div>
      </section>

      <TooltipProvider>
        <div className="mt-7 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {stats.map((stat, index) => (
            <Tooltip key={stat.label}>
              <TooltipTrigger asChild>
                <AdminSummaryCard
                  className={
                  index === 0 ? "col-span-2 sm:col-span-3 lg:col-span-1" :
                  stat.icon === Wrench ? "col-span-2 sm:col-span-1" : undefined
                }
                  label={stat.label}
                  value={loading ? "—" : stat.value}
                  icon={stat.icon}
                  tone={index === 0 ? "blue" : undefined}
                  description={stat.description}
                />
              </TooltipTrigger>
              <TooltipContent>{stat.tooltip}</TooltipContent>
            </Tooltip>
          ))}
        </div>
      </TooltipProvider>

      <div className="mt-5 grid gap-5 lg:grid-cols-2">
        <section className={customerPanelClass}>
          <div className="mb-5 flex items-center justify-between">
            <div>
              <h2 className="text-base font-semibold">Recent appointments</h2>
            </div>
            <Link href="/account/appointments" className="text-xs font-semibold text-[#2c5282] hover:underline">
              View all
            </Link>
          </div>
          <div className="space-y-3">
            {loading ? (
              <CustomerCardGridSkeleton count={3} />
            ) : (
              <>
                {appointments.slice(0, 3).map((appointment) => (
                  <AppointmentCard key={appointment.id} appointment={appointment} />
                ))}
                {appointments.length === 0 && <EmptyState label="No appointments yet." />}
              </>
            )}
          </div>
        </section>

        <section className={customerPanelClass}>
          <div className="mb-5 flex items-center justify-between">
            <div>
              <h2 className="text-base font-semibold">Active work jobs</h2>
            </div>
            <Link href="/account/work-jobs" className="text-xs font-semibold text-[#2c5282] hover:underline">
              View all
            </Link>
          </div>
          <div className="space-y-3">
            {loading ? (
              <CustomerCardGridSkeleton count={3} />
            ) : (
              <>
                {workJobs.slice(0, 3).map((workJob) => (
                  <WorkJobCard key={workJob.id} workJob={workJob} />
                ))}
                {workJobs.length === 0 && <EmptyState label="No work jobs yet." />}
              </>
            )}
          </div>
        </section>
      </div>
    </>
  );
}

function EmptyState({ label }: { label: string }) {
  return (
    <div className="rounded-xl border border-dashed border-border bg-muted p-8 text-center text-sm text-muted-foreground">
      {label}
    </div>
  );
}
