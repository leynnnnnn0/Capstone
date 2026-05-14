"use client";

import { useEffect, useState } from "react";

import AdminAppointmentCalendar from "@/components/admin-appointments/AdminAppointmentCalendar";
import { fetchAdminAppointments } from "@/features/admin-appointments/admin-appointment-api";
import type { AdminAppointment } from "@/features/admin-appointments/types";

export default function AdminCalendarPage() {
  const [appointments, setAppointments] = useState<AdminAppointment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAdminAppointments({ per_page: "250" })
      .then((response) => setAppointments(response.data))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-5">
      <div>
        <p className="text-xs font-semibold uppercase tracking-widest text-primary">Calendar</p>
        <h1 className="mt-2 text-xl font-semibold tracking-tight">Calendar</h1>
        <p className="mt-1 text-sm text-muted-foreground">Appointments overview and workers schedule.</p>
      </div>

      {loading ? (
        <div className="rounded-lg border bg-card p-6 text-sm text-muted-foreground">Loading calendar...</div>
      ) : (
        <AdminAppointmentCalendar appointments={appointments} />
      )}
    </div>
  );
}
