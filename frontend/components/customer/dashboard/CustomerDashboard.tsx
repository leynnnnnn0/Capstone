"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { CalendarPlus, Clock, Wrench } from "lucide-react";

import AppointmentCard from "@/components/customer/appointments/AppointmentCard";
import CustomerShell from "@/components/customer/shared/CustomerShell";
import WorkJobCard from "@/components/customer/work-jobs/WorkJobCard";
import {
  getCustomerAppointments,
  getCustomerWorkJobs,
} from "@/features/customer/customer-api";
import { isActiveAppointment, isActiveWorkJob } from "@/features/customer/customer-utils";
import type { CustomerAppointment, CustomerWorkJob } from "@/features/customer/types";

export default function CustomerDashboard() {
  const [appointments, setAppointments] = useState<CustomerAppointment[]>([]);
  const [workJobs, setWorkJobs] = useState<CustomerWorkJob[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([getCustomerAppointments(), getCustomerWorkJobs()])
      .then(([appointmentResponse, workJobResponse]) => {
        setAppointments(appointmentResponse.data);
        setWorkJobs(workJobResponse.data);
      })
      .finally(() => setLoading(false));
  }, []);

  const stats = useMemo(
    () => [
      { label: "Active Appointments", value: appointments.filter(isActiveAppointment).length, icon: Clock },
      { label: "Active Work Jobs", value: workJobs.filter(isActiveWorkJob).length, icon: Wrench },
      { label: "Pending Appointments", value: appointments.filter((item) => item.status === "pending").length, icon: CalendarPlus },
    ],
    [appointments, workJobs],
  );

  return (
    <CustomerShell>
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-primary">Customer Dashboard</p>
          <h1 className="mt-2 text-base font-medium text-slate-950">Welcome back</h1>
          <p className="mt-1 text-sm text-slate-500">
            Manage your inspections and installation progress from one place.
          </p>
        </div>
        <Link
          href="/account/appointments/new"
          className="inline-flex h-10 items-center justify-center rounded-lg bg-primary px-4 text-sm font-medium text-white shadow-sm hover:bg-primary/90"
        >
          New Appointment
        </Link>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        {stats.map((stat) => {
          const Icon = stat.icon;

          return (
            <div key={stat.label} className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
              <Icon className="mb-3 size-5 text-primary" />
              <p className="text-base font-medium text-slate-950">{loading ? "-" : stat.value}</p>
              <p className="text-sm font-medium text-slate-500">{stat.label}</p>
            </div>
          );
        })}
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <section>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-base font-semibold text-slate-950">Recent Appointments</h2>
            <Link href="/account/appointments" className="text-sm font-medium text-primary hover:underline">
              View all
            </Link>
          </div>
          <div className="space-y-3">
            {appointments.slice(0, 3).map((appointment) => (
              <AppointmentCard key={appointment.id} appointment={appointment} />
            ))}
            {!loading && appointments.length === 0 && <EmptyState label="No appointments yet." />}
          </div>
        </section>

        <section>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-base font-semibold text-slate-950">Active Work Jobs</h2>
            <Link href="/account/work-jobs" className="text-sm font-medium text-primary hover:underline">
              View all
            </Link>
          </div>
          <div className="space-y-3">
            {workJobs.slice(0, 3).map((workJob) => (
              <WorkJobCard key={workJob.id} workJob={workJob} />
            ))}
            {!loading && workJobs.length === 0 && <EmptyState label="No work jobs yet." />}
          </div>
        </section>
      </div>
    </CustomerShell>
  );
}

function EmptyState({ label }: { label: string }) {
  return (
    <div className="rounded-lg border border-dashed border-slate-200 bg-white p-6 text-center text-sm font-medium text-slate-500">
      {label}
    </div>
  );
}
