"use client";

import { useCallback, useEffect, useState } from "react";

import AdminAppointmentCalendar from "@/components/admin-appointments/AdminAppointmentCalendar";
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
  const isWorker = hasRole(user, "worker");

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
    <div className="space-y-4">
      <div className="rounded-[1.5rem] border border-white/10 bg-[#162d4a] p-5 text-white shadow-[0_18px_55px_rgba(22,45,74,0.12)] sm:p-6">
        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#b9cfe0]">Team scheduling</p>
        <h1 className="mt-2 text-2xl font-semibold tracking-[-0.035em] text-white">Calendar</h1>
        <p className="mt-1 text-xs text-white/55 sm:text-sm">
          {isWorker ? "Your assigned schedule." : "Appointments overview and workers schedule."}
        </p>
      </div>

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
