"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { BriefcaseBusiness, CalendarDays, Clock3, Plus } from "lucide-react";

import AdminSummaryCard from "@/components/admin/AdminSummaryCard";
import AdminAppointmentCalendar from "@/components/admin-appointments/AdminAppointmentCalendar";
import { Button } from "@/components/ui/button";
import { CalendarPageSkeleton } from "@/components/ui/page-skeletons";
import { fetchAdminAppointments } from "@/features/admin-appointments/admin-appointment-api";
import type { AdminAppointment } from "@/features/admin-appointments/types";
import { fetchAdminWorkJobs } from "@/features/admin-work-jobs/admin-work-job-api";
import type { AdminWorkJob } from "@/features/admin-work-jobs/types";
import { hasRole } from "@/features/auth/current-user-api";
import { useCurrentUser } from "@/hooks/use-current-user";
import { useRealtimeRefresh } from "@/hooks/use-realtime";

export default function AdminCalendarPage() {
  const { user } = useCurrentUser();
  const [appointments, setAppointments] = useState<AdminAppointment[]>([]);
  const [workJobs, setWorkJobs] = useState<AdminWorkJob[]>([]);
  const [loading, setLoading] = useState(true);
  const isWorker = hasRole(user, "staff");

  const reload = useCallback(() => {
    Promise.all([
      fetchAdminAppointments({ per_page: "250" }),
      fetchAdminWorkJobs({ per_page: "250" }),
    ])
      .then(([appointmentResponse, workJobResponse]) => {
        setAppointments(appointmentResponse.data);
        setWorkJobs(workJobResponse.data);
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  useRealtimeRefresh(() => {
    setLoading(true);
    reload();
  }, ["appointment", "work_job", "work-job"]);

  return (
    <div className="space-y-10">
      <section className="flex flex-col gap-5 border-b pb-8 sm:gap-8 sm:pb-10 lg:flex-row lg:items-center lg:justify-between">
        <div className="max-w-3xl">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#64879a]">
            Administration · Schedule overview
          </p>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight text-[#2d425b] sm:mt-4 sm:text-4xl">Calendar</h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-[#71869c] sm:mt-4 sm:text-base sm:leading-7">
            {isWorker ? "Review your assigned appointments and field schedule." : "Review appointments, field work, and staff schedules in one shared calendar."}
          </p>
        </div>
        <div className="flex shrink-0 flex-col items-start gap-5 lg:items-end">
          {!isWorker && (
            <Button asChild size="lg" className="gap-2 bg-[#2d425b] hover:bg-[#23364b]">
              <Link href="/dashboard/appointments/create">
                <Plus className="size-4" />
                Create appointment
              </Link>
            </Button>
          )}
          <div className="hidden items-center gap-3 md:flex">
            <span className="flex size-10 items-center justify-center rounded-lg bg-[#eef4f7] text-[#64879a]">
              <CalendarDays className="size-4" />
            </span>
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#8194a7]">Schedule</p>
              <p className="mt-0.5 text-sm font-semibold text-[#2d425b]">{appointments.length + workJobs.length} scheduled record{appointments.length + workJobs.length === 1 ? "" : "s"}</p>
            </div>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-2 gap-x-4 border-b pb-8 sm:grid-cols-3 sm:gap-x-7 sm:pb-10 [&>*:first-child]:col-span-2 sm:[&>*:first-child]:col-span-1">
        <AdminSummaryCard label="Appointments" value={appointments.length} icon={CalendarDays} eyebrow="Live workspace" description="customer scheduling records" />
        <AdminSummaryCard label="Work jobs" value={workJobs.length} icon={BriefcaseBusiness} eyebrow="Live workspace" description="field operation schedules" />
        <AdminSummaryCard label="Pending appointments" value={appointments.filter((appointment) => appointment.status === "pending").length} icon={Clock3} eyebrow="Live workspace" description="awaiting confirmation" />
      </section>

      {loading ? (
        <CalendarPageSkeleton />
      ) : (
        <AdminAppointmentCalendar
          appointments={appointments}
          workJobs={workJobs}
          defaultMode={isWorker ? "workers" : "appointments"}
          lockedMode={isWorker ? "workers" : undefined}
          fitToContainer={isWorker}
          compact={isWorker}
        />
      )}
    </div>
  );
}
