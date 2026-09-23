"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRight, CalendarPlus, Clock, Wrench } from "lucide-react";

import AppointmentCard from "@/components/customer/appointments/AppointmentCard";
import WorkJobCard from "@/components/customer/work-jobs/WorkJobCard";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { CustomerCardGridSkeleton } from "@/components/ui/page-skeletons";
import { Skeleton } from "@/components/ui/skeleton";
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
        label: "Active Appointments",
        value: appointments.filter(isActiveAppointment).length,
        icon: Clock,
        description: "appointments in progress",
        tooltip: "Appointments still moving through inspection, quotation, or scheduling.",
      },
      {
        label: "Active Work Jobs",
        value: workJobs.filter(isActiveWorkJob).length,
        icon: Wrench,
        description: "scheduled or active jobs",
        tooltip: "Installation or service jobs that are scheduled or in progress.",
      },
      {
        label: "Pending Appointments",
        value: appointments.filter((item) => item.status === "pending").length,
        icon: CalendarPlus,
        description: "awaiting schedule confirmation",
        tooltip: "Requests waiting for the SOG team to confirm the schedule.",
      },
    ],
    [appointments, workJobs],
  );

  return (
    <>
      <section className="py-1">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
          <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
          <p className="mt-1 max-w-xl text-sm text-muted-foreground">
            Manage your inspections and installation progress from one place.
          </p>
        </div>
        <Link
          href="/account/appointments/new"
          className="group inline-flex h-9 w-fit items-center justify-center gap-2 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
        >
          New appointment
          <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
        </Link>
      </div>
      </section>

      <TooltipProvider>
        <div className="mt-8 grid grid-cols-2 gap-x-4 sm:grid-cols-3 sm:gap-x-7 [&>*:first-child]:col-span-2 sm:[&>*:first-child]:col-span-1">
          {stats.map((stat) => {
            const Icon = stat.icon;

            return (
              <Tooltip key={stat.label}>
                <TooltipTrigger asChild>
                  <article className="min-h-28 border-t py-4 text-left sm:min-h-40 sm:py-6">
                    <div className="flex items-start justify-between gap-2 sm:gap-4">
                      <div>
                        <p className="text-[9px] font-semibold uppercase tracking-[0.14em] text-[#8194a7] sm:text-[10px] sm:tracking-[0.16em]">My activity</p>
                        <h2 className="mt-2 text-xs font-medium leading-4 text-[#496078] sm:mt-3 sm:text-sm">{stat.label}</h2>
                      </div>
                      <Icon className="mt-0.5 size-4 shrink-0 text-[#64879a] sm:size-[18px]" />
                    </div>
                    {loading ? <Skeleton className="mt-2 h-7 w-10 sm:h-8 sm:w-12" /> : <p className="mt-1 text-2xl font-semibold tracking-tight text-[#2d425b] sm:text-3xl">{stat.value}</p>}
                    <p className="mt-1.5 line-clamp-2 text-[11px] leading-4 text-[#64879a] sm:mt-2 sm:line-clamp-1 sm:text-xs">{stat.description}</p>
                  </article>
                </TooltipTrigger>
                <TooltipContent>{stat.tooltip}</TooltipContent>
              </Tooltip>
            );
          })}
        </div>
      </TooltipProvider>

      <div className="mt-8 grid gap-5 lg:grid-cols-2">
        <section className="rounded-lg border bg-white p-4 sm:p-5">
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

        <section className="rounded-lg border bg-white p-4 sm:p-5">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground">Installation</p>
              <h2 className="mt-1 text-base font-semibold">Active work jobs</h2>
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
    <div className="rounded-md border border-dashed bg-muted/30 p-8 text-center text-sm text-muted-foreground">
      {label}
    </div>
  );
}
