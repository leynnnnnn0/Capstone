"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Bar, BarChart, CartesianGrid, Tooltip, XAxis, YAxis } from "recharts";
import { BriefcaseBusiness, CalendarCheck, CheckCircle2, ClipboardList } from "lucide-react";

import AdminAppointmentCalendar from "@/components/admin-appointments/AdminAppointmentCalendar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart";
import { Button } from "@/components/ui/button";
import { fetchAdminAppointments } from "@/features/admin-appointments/admin-appointment-api";
import { adminStatusMeta, formatAdminDate, formatAdminTime } from "@/features/admin-appointments/admin-appointment-utils";
import type { AdminAppointment } from "@/features/admin-appointments/types";
import { fetchAdminWorkJobs } from "@/features/admin-work-jobs/admin-work-job-api";
import { formatWorkJobSchedule, workJobStatusLabel } from "@/features/admin-work-jobs/admin-work-job-utils";
import type { AdminWorkJob } from "@/features/admin-work-jobs/types";
import type { User } from "@/types/user";

const chartConfig = {
  count: { label: "Assigned", color: "#5f87b5" },
} satisfies ChartConfig;

export default function WorkerDashboardPage({ user }: { user: User | null }) {
  const [appointments, setAppointments] = useState<AdminAppointment[]>([]);
  const [workJobs, setWorkJobs] = useState<AdminWorkJob[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
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

  const metrics = useMemo(() => buildWorkerMetrics(appointments, workJobs), [appointments, workJobs]);

  if (loading) {
    return <div className="rounded-lg border bg-card p-6 text-sm text-muted-foreground">Loading dashboard...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-semibold uppercase tracking-widest text-primary">Worker Dashboard</p>
        <h1 className="mt-2 text-xl font-semibold tracking-tight">Welcome back, {user?.first_name ?? "there"}</h1>
        <p className="mt-1 text-sm text-muted-foreground">Your assigned appointments, work jobs, progress, and calendar.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard title="Upcoming Appointments" value={metrics.upcomingAppointments.length} description="Assigned inspections ahead" icon={CalendarCheck} />
        <MetricCard title="Upcoming Work Jobs" value={metrics.upcomingWorkJobs.length} description="Scheduled installation jobs" icon={BriefcaseBusiness} />
        <MetricCard title="Finished Appointments" value={metrics.finishedAppointments} description="Completed inspections" icon={CheckCircle2} />
        <MetricCard title="Finished Work Jobs" value={metrics.finishedWorkJobs} description="Completed jobs" icon={ClipboardList} />
      </div>

      <div className="grid gap-4 xl:grid-cols-5">
        <Card className="xl:col-span-3">
          <CardHeader>
            <CardTitle className="text-base">Assigned Status</CardTitle>
            <CardDescription>Current workload by progress state.</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-[260px]">
              <BarChart data={metrics.statusChart}>
                <CartesianGrid vertical={false} strokeDasharray="3 3" />
                <XAxis dataKey="status" tickLine={false} axisLine={false} />
                <YAxis allowDecimals={false} tickLine={false} axisLine={false} />
                <Tooltip content={<ChartTooltipContent />} />
                <Bar dataKey="count" fill="var(--color-count)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>

        <Card className="xl:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Today</CardTitle>
            <CardDescription>Appointments and jobs scheduled for today.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {metrics.todayItems.length ? metrics.todayItems.map((item) => (
              <ScheduleItem key={item.href} {...item} />
            )) : (
              <p className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">No assigned work scheduled today.</p>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <ScheduleList title="Upcoming Appointments" items={metrics.upcomingAppointments.map((appointment) => ({
          href: `/dashboard/appointments/${appointment.id}`,
          code: appointment.appointment_number,
          title: appointment.full_name,
          detail: `${formatAdminDate(appointment.appointment_date)} · ${formatAdminTime(appointment.appointment_time_from)} - ${formatAdminTime(appointment.appointment_time_until)}`,
        }))} />
        <ScheduleList title="Upcoming Work Jobs" items={metrics.upcomingWorkJobs.map((job) => ({
          href: `/dashboard/work-jobs/${job.id}`,
          code: job.work_job_number,
          title: job.full_name,
          detail: formatWorkJobSchedule(job),
        }))} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">My Calendar</CardTitle>
          <CardDescription>Only assigned appointments are shown.</CardDescription>
        </CardHeader>
        <CardContent>
          <AdminAppointmentCalendar
            appointments={appointments}
            defaultMode="workers"
            lockedMode="workers"
            fitToContainer
            compact
          />
        </CardContent>
      </Card>
    </div>
  );
}

function MetricCard({ title, value, description, icon: Icon }: { title: string; value: number; description: string; icon: typeof CalendarCheck }) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="size-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-semibold">{value}</div>
        <p className="mt-1 text-xs text-muted-foreground">{description}</p>
      </CardContent>
    </Card>
  );
}

function ScheduleList({ title, items }: { title: string; items: ScheduleLine[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {items.length ? items.map((item) => <ScheduleItem key={item.href} {...item} />) : (
          <p className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">Nothing scheduled yet.</p>
        )}
      </CardContent>
    </Card>
  );
}

type ScheduleLine = {
  href: string;
  code: string;
  title: string;
  detail: string;
};

function ScheduleItem({ href, code, title, detail }: ScheduleLine) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-lg border px-3 py-2">
      <div>
        <p className="text-xs font-semibold uppercase tracking-widest text-primary">{code}</p>
        <p className="mt-1 text-sm font-medium">{title}</p>
        <p className="text-xs text-muted-foreground">{detail}</p>
      </div>
      <Button asChild variant="outline" size="sm">
        <Link href={href}>Open</Link>
      </Button>
    </div>
  );
}

function buildWorkerMetrics(appointments: AdminAppointment[], workJobs: AdminWorkJob[]) {
  const today = new Date().toISOString().slice(0, 10);
  const upcomingAppointments = appointments
    .filter((item) => item.appointment_date && item.appointment_date >= today && !["cancelled", "no_show", "completed"].includes(item.status))
    .sort((a, b) => `${a.appointment_date}${a.appointment_time_from}`.localeCompare(`${b.appointment_date}${b.appointment_time_from}`))
    .slice(0, 6);
  const upcomingWorkJobs = workJobs
    .filter((item) => item.scheduled_date && item.scheduled_date >= today && !["cancelled", "completed"].includes(item.status))
    .sort((a, b) => `${a.scheduled_date}${a.scheduled_time_from}`.localeCompare(`${b.scheduled_date}${b.scheduled_time_from}`))
    .slice(0, 6);

  const appointmentStatus = new Map<string, number>();
  appointments.forEach((item) => appointmentStatus.set(item.status, (appointmentStatus.get(item.status) ?? 0) + 1));
  workJobs.forEach((item) => appointmentStatus.set(item.status, (appointmentStatus.get(item.status) ?? 0) + 1));

  return {
    upcomingAppointments,
    upcomingWorkJobs,
    finishedAppointments: appointments.filter((item) => item.status === "completed").length,
    finishedWorkJobs: workJobs.filter((item) => item.status === "completed").length,
    todayItems: [
      ...appointments
        .filter((item) => item.appointment_date === today)
        .map((item) => ({
          href: `/dashboard/appointments/${item.id}`,
          code: item.appointment_number,
          title: item.full_name,
          detail: `${formatAdminTime(item.appointment_time_from)} - ${formatAdminTime(item.appointment_time_until)}`,
        })),
      ...workJobs
        .filter((item) => item.scheduled_date === today)
        .map((item) => ({
          href: `/dashboard/work-jobs/${item.id}`,
          code: item.work_job_number,
          title: item.full_name,
          detail: `${formatAdminTime(item.scheduled_time_from)} - ${formatAdminTime(item.scheduled_time_until)}`,
        })),
    ],
    statusChart: Array.from(appointmentStatus.entries()).map(([status, count]) => ({
      status: adminStatusMeta[status as keyof typeof adminStatusMeta]?.label ?? workJobStatusLabel(status),
      count,
    })),
  };
}
