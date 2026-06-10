"use client";

import { useCallback, useEffect, useState } from "react";

import AdminAppointmentCalendar from "@/components/admin-appointments/AdminAppointmentCalendar";
import { CalendarPageSkeleton } from "@/components/ui/page-skeletons";
import { fetchAdminAppointments } from "@/features/admin-appointments/admin-appointment-api";
import type { AdminAppointment } from "@/features/admin-appointments/types";
import { hasRole } from "@/features/auth/current-user-api";
import { useCurrentUser } from "@/hooks/use-current-user";
import { useRealtimeRefresh } from "@/hooks/use-realtime";

export default function AdminCalendarPage() {
  const { user } = useCurrentUser();
  const [appointments, setAppointments] = useState<AdminAppointment[]>([]);
  const [loading, setLoading] = useState(true);
  const isWorker = hasRole(user, "worker");

  const reload = useCallback(() => {
    fetchAdminAppointments({ per_page: "250" })
      .then((response) => setAppointments(response.data))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  useRealtimeRefresh(() => {
    setLoading(true);
    reload();
  }, ["appointment"]);

  return (
    <div className="space-y-4">
      <div>
        <p className="text-xs font-semibold uppercase tracking-widest text-primary">Calendar</p>
        <h1 className="mt-1 text-lg font-semibold tracking-tight sm:text-xl">Calendar</h1>
        <p className="mt-1 text-xs text-muted-foreground sm:text-sm">
          {isWorker ? "Your assigned schedule." : "Appointments overview and workers schedule."}
        </p>
      </div>

      {loading ? (
        <CalendarPageSkeleton />
      ) : (
        <AdminAppointmentCalendar
          appointments={appointments}
          defaultMode={isWorker ? "workers" : "appointments"}
          lockedMode={isWorker ? "workers" : undefined}
          fitToContainer={isWorker}
          compact={isWorker}
        />
      )}
    </div>
  );
}
