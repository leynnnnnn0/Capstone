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
        tooltip: "Appointments still moving through inspection, quotation, or scheduling.",
      },
      {
        label: "Active Work Jobs",
        value: workJobs.filter(isActiveWorkJob).length,
        icon: Wrench,
        tooltip: "Installation or service jobs that are scheduled or in progress.",
      },
      {
        label: "Pending Appointments",
        value: appointments.filter((item) => item.status === "pending").length,
        icon: CalendarPlus,
        tooltip: "Requests waiting for the SOG team to confirm the schedule.",
      },
    ],
    [appointments, workJobs],
  );

  return (
    <>
      <section className="relative overflow-hidden rounded-[1.75rem] bg-[#162d4a] px-5 py-9 text-white sm:px-9 sm:py-11 lg:px-12">
        <div className="absolute -right-20 -top-28 h-72 w-72 rounded-full bg-[#608db9]/25 blur-3xl" />
        <div className="relative flex flex-col gap-7 sm:flex-row sm:items-end sm:justify-between">
          <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-white/55 sm:text-xs">Customer Dashboard</p>
          <h1 className="mt-3 text-[clamp(2.5rem,6vw,5.5rem)] font-medium leading-[0.9] tracking-[-0.055em]">Welcome back.</h1>
          <p className="mt-4 max-w-xl text-sm leading-6 text-white/60 sm:text-base">
            Manage your inspections and installation progress from one place.
          </p>
        </div>
        <Link
          href="/account/appointments/new"
          className="group inline-flex w-fit items-center justify-center gap-2 rounded-full bg-white px-5 py-3 text-sm font-semibold text-[#162d4a] transition-colors hover:bg-[#c8dae8]"
        >
          New appointment
          <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
        </Link>
      </div>
      </section>

      <TooltipProvider>
        <div className="mt-3 grid gap-3 sm:grid-cols-3">
          {stats.map((stat) => {
            const Icon = stat.icon;

            return (
              <Tooltip key={stat.label}>
                <TooltipTrigger asChild>
                  <div className="group rounded-[1.25rem] border border-[#dce4ea] bg-white p-5 text-left transition-all hover:-translate-y-0.5 hover:shadow-[0_18px_55px_rgba(22,45,74,0.08)]">
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#667584] sm:text-xs">{stat.label}</p>
                      <span className="flex size-9 items-center justify-center rounded-full bg-[#eaf2f8] text-[#2c5282]">
                        <Icon className="size-4" />
                      </span>
                    </div>
                    <div className="mt-5">
                      {loading ? (
                        <Skeleton className="h-9 w-12" />
                      ) : (
                        <p className="text-3xl font-medium tracking-[-0.04em] text-[#101820]">{stat.value}</p>
                      )}
                    </div>
                  </div>
                </TooltipTrigger>
                <TooltipContent>{stat.tooltip}</TooltipContent>
              </Tooltip>
            );
          })}
        </div>
      </TooltipProvider>

      <div className="mt-8 grid gap-5 lg:grid-cols-2">
        <section className="rounded-[1.75rem] bg-white p-4 sm:p-6">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#608db9]">Schedule</p>
              <h2 className="mt-1 text-xl font-medium tracking-[-0.03em] text-[#101820]">Recent appointments</h2>
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

        <section className="rounded-[1.75rem] bg-white p-4 sm:p-6">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#608db9]">Installation</p>
              <h2 className="mt-1 text-xl font-medium tracking-[-0.03em] text-[#101820]">Active work jobs</h2>
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
    <div className="rounded-[1.25rem] border border-dashed border-[#cbd6de] bg-[#f8fafb] p-8 text-center text-sm font-medium text-[#667584]">
      {label}
    </div>
  );
}
