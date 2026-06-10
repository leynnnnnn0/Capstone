"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { CalendarCheck, CircleDollarSign, ClipboardList, Package, TriangleAlert, Wrench } from "lucide-react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Tooltip as UiTooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { fetchAdminAppointments } from "@/features/admin-appointments/admin-appointment-api";
import { adminStatusMeta, formatAdminDate } from "@/features/admin-appointments/admin-appointment-utils";
import type { AdminAppointment } from "@/features/admin-appointments/types";
import { fetchAdminPayments } from "@/features/admin-payments/admin-payment-api";
import type { AdminPayment } from "@/features/admin-payments/types";
import { fetchAdminWorkJobs } from "@/features/admin-work-jobs/admin-work-job-api";
import type { AdminWorkJob } from "@/features/admin-work-jobs/types";
import type { CustomerQuotationItem } from "@/features/customer/types";

const statusChartConfig = {
  count: { label: "Appointments", color: "#5f87b5" },
} satisfies ChartConfig;

const revenueChartConfig = {
  paid: { label: "Paid Collections", color: "#0f8a4b" },
  pending: { label: "Pending Payments", color: "#d49b25" },
} satisfies ChartConfig;

const workloadChartConfig = {
  jobs: { label: "Assigned Jobs", color: "#7a5af8" },
} satisfies ChartConfig;

const pieColors = ["#5f87b5", "#0f8a4b", "#d49b25", "#c2410c", "#7a5af8", "#64748b"];

export default function AdminDashboardPage() {
  const [appointments, setAppointments] = useState<AdminAppointment[]>([]);
  const [workJobs, setWorkJobs] = useState<AdminWorkJob[]>([]);
  const [payments, setPayments] = useState<AdminPayment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetchAdminAppointments({ per_page: "250" }),
      fetchAdminWorkJobs({ per_page: "250" }),
      fetchAdminPayments({ per_page: "250" }),
    ])
      .then(([appointmentResponse, workJobResponse, paymentResponse]) => {
        setAppointments(appointmentResponse.data);
        setWorkJobs(workJobResponse.data);
        setPayments(paymentResponse.data);
      })
      .finally(() => setLoading(false));
  }, []);

  const metrics = useMemo(() => buildMetrics(appointments, workJobs, payments), [appointments, workJobs, payments]);

  if (loading) {
    return <AdminDashboardSkeleton />;
  }

  return (
    <div className="space-y-4 lg:space-y-5">
      <div>
        <p className="text-xs font-semibold uppercase tracking-widest text-primary">Business Overview</p>
        <h1 className="mt-1 text-lg font-semibold tracking-tight sm:text-xl">Dashboard</h1>
        <p className="mt-1 text-xs text-muted-foreground sm:text-sm">Collections, appointments, workload, and operational risks.</p>
      </div>

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <TooltipProvider>
          <MetricCard
            title="Collected Revenue"
            value={peso(metrics.collectedRevenue)}
            description={`${metrics.paidPayments} paid payments · ${peso(metrics.additionalChargesPaid)} add-ons`}
            icon={CircleDollarSign}
            tooltip="Paid records from PayPal, cash, bank transfers, and additional charges."
          />
          <MetricCard
            title="Open Appointments"
            value={metrics.openAppointments.toString()}
            description={`${metrics.pendingAppointments} pending review`}
            icon={ClipboardList}
            tooltip="Appointments that are not completed, cancelled, or marked no show."
          />
          <MetricCard
            title="Today's Schedule"
            value={metrics.todayAppointments.toString()}
            description={`${metrics.todayWorkJobs} work jobs today`}
            icon={CalendarCheck}
            tooltip="Confirmed appointments and scheduled work jobs for today."
          />
          <MetricCard
            title="No Show / Cancelled"
            value={metrics.serviceRisks.toString()}
            description="Bookings needing follow-up"
            icon={TriangleAlert}
            tooltip="Cancelled and no-show appointments that may need admin review."
          />
        </TooltipProvider>
      </div>

      <div className="grid gap-3 xl:grid-cols-7">
        <Card className="xl:col-span-4">
          <CardHeader>
            <CardTitle className="text-sm sm:text-base">Collections Trend</CardTitle>
            <CardDescription>Paid collections versus pending payment requests by month.</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={revenueChartConfig} className="h-[220px] sm:h-[240px] xl:h-[260px]">
              <AreaChart data={metrics.collectionsByMonth} margin={{ left: 0, right: 8, top: 12 }}>
                <CartesianGrid vertical={false} strokeDasharray="3 3" />
                <XAxis dataKey="month" tickLine={false} axisLine={false} />
                <YAxis width={42} tickLine={false} axisLine={false} tickFormatter={(value) => `₱${Number(value) / 1000}k`} />
                <Tooltip content={<ChartTooltipContent />} />
                <Area dataKey="pending" type="monotone" fill="var(--color-pending)" fillOpacity={0.18} stroke="var(--color-pending)" />
                <Area dataKey="paid" type="monotone" fill="var(--color-paid)" fillOpacity={0.22} stroke="var(--color-paid)" />
              </AreaChart>
            </ChartContainer>
          </CardContent>
        </Card>

        <Card className="xl:col-span-3">
          <CardHeader>
            <CardTitle className="text-sm sm:text-base">Appointment Status</CardTitle>
            <CardDescription>Current operational distribution.</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={statusChartConfig} className="h-[220px] sm:h-[240px] xl:h-[260px]">
              <PieChart>
                <Tooltip content={<ChartTooltipContent />} />
                <Pie data={metrics.statusData} dataKey="count" nameKey="status" innerRadius={44} outerRadius={78} paddingAngle={2}>
                  {metrics.statusData.map((entry, index) => (
                    <Cell key={entry.status} fill={pieColors[index % pieColors.length]} />
                  ))}
                </Pie>
              </PieChart>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-3 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm sm:text-base">Worker Load</CardTitle>
            <CardDescription>Assigned appointments and work jobs.</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={workloadChartConfig} className="h-[210px] sm:h-[230px]">
              <BarChart data={metrics.workerLoad} margin={{ left: 0, right: 8, top: 12 }}>
                <CartesianGrid vertical={false} strokeDasharray="3 3" />
                <XAxis dataKey="worker" tickLine={false} axisLine={false} />
                <YAxis width={28} allowDecimals={false} tickLine={false} axisLine={false} />
                <Tooltip content={<ChartTooltipContent />} />
                <Bar dataKey="jobs" fill="var(--color-jobs)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm sm:text-base">Top Work Job Products</CardTitle>
            <CardDescription>Products appearing most often in customer work jobs.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2.5">
              {metrics.topProducts.length ? metrics.topProducts.map((item, index) => (
                <div key={item.name} className="flex items-center justify-between rounded-lg border px-2.5 py-2 sm:px-3">
                  <div className="flex min-w-0 items-center gap-2.5 sm:gap-3">
                    <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary sm:size-7">{index + 1}</span>
                    <div>
                      <p className="truncate text-xs font-medium sm:text-sm">{item.name}</p>
                      <p className="text-xs text-muted-foreground">{item.count} work job item{item.count === 1 ? "" : "s"}</p>
                    </div>
                  </div>
                  <Package className="size-4 text-muted-foreground" />
                </div>
              )) : (
                <p className="text-sm text-muted-foreground">No work job quotation items yet.</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-3 xl:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm sm:text-base">Upcoming Appointments</CardTitle>
            <CardDescription>Next confirmed schedules.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2.5">
            {metrics.upcomingAppointments.map((appointment) => (
              <CompactSchedule key={appointment.id} title={appointment.full_name} code={appointment.appointment_number} date={formatAdminDate(appointment.appointment_date)} />
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm sm:text-base">Active Work Jobs</CardTitle>
            <CardDescription>Installations and field work in motion.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2.5">
            {metrics.activeWorkJobs.map((job) => (
              <CompactSchedule key={job.id} title={job.full_name} code={job.work_job_number} date={formatAdminDate(job.scheduled_date)} />
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm sm:text-base">Service Mix</CardTitle>
            <CardDescription>Demand by requested service type.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {metrics.serviceMix.map((item) => (
              <div key={item.service} className="flex items-center justify-between text-xs sm:text-sm">
                <span className="capitalize text-muted-foreground">{item.service.replaceAll("_", " ")}</span>
                <span className="font-medium">{item.count}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export function AdminDashboardSkeleton() {
  return (
    <div className="space-y-4 lg:space-y-5" aria-label="Loading dashboard">
      <div className="space-y-2">
        <Skeleton className="h-3 w-36" />
        <Skeleton className="h-7 w-28" />
        <Skeleton className="h-4 w-80 max-w-full" />
      </div>

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <Card key={index}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <Skeleton className="h-4 w-28" />
              <Skeleton className="size-4 rounded-full" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-24" />
              <Skeleton className="mt-2 h-3 w-40 max-w-full" />
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-3 xl:grid-cols-7">
        <DashboardChartSkeleton className="xl:col-span-4" />
        <DashboardChartSkeleton className="xl:col-span-3" variant="pie" />
      </div>

      <div className="grid gap-3 xl:grid-cols-2">
        <DashboardChartSkeleton />
        <Card>
          <DashboardCardHeading />
          <CardContent className="space-y-3">
            {Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className="flex items-center justify-between rounded-lg border px-3 py-2">
                <div className="flex items-center gap-3">
                  <Skeleton className="size-7 rounded-full" />
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                </div>
                <Skeleton className="size-4 rounded-full" />
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-3 xl:grid-cols-3">
        {Array.from({ length: 3 }).map((_, cardIndex) => (
          <Card key={cardIndex}>
            <DashboardCardHeading />
            <CardContent className="space-y-3">
              {Array.from({ length: 3 }).map((_, rowIndex) => (
                <div key={rowIndex} className="space-y-2 rounded-lg border px-3 py-2">
                  <Skeleton className="h-4 w-28" />
                  <Skeleton className="h-3 w-full" />
                </div>
              ))}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

function DashboardChartSkeleton({ className, variant = "bars" }: { className?: string; variant?: "bars" | "pie" }) {
  return (
    <Card className={className}>
      <DashboardCardHeading />
      <CardContent>
        <div className="flex h-[220px] items-end justify-center gap-3 rounded-lg bg-muted/35 p-4 sm:h-[240px] xl:h-[260px]">
          {variant === "pie" ? (
            <Skeleton className="size-40 rounded-full" />
          ) : (
            [42, 64, 48, 78, 58, 86, 68].map((height, index) => (
            <Skeleton key={index} className="w-6 sm:w-8" style={{ height: `${height}%` }} />
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function DashboardCardHeading() {
  return (
    <CardHeader>
      <Skeleton className="h-4 w-36" />
      <Skeleton className="h-3 w-56 max-w-full" />
    </CardHeader>
  );
}

function MetricCard({
  title,
  value,
  description,
  icon: Icon,
  tooltip,
}: {
  title: string;
  value: string;
  description: string;
  icon: typeof Wrench;
  tooltip: string;
}) {
  return (
    <UiTooltip>
      <TooltipTrigger asChild>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{title}</CardTitle>
            <Icon className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-xl font-semibold sm:text-2xl">{value}</div>
            <p className="mt-1 text-xs text-muted-foreground">{description}</p>
          </CardContent>
        </Card>
      </TooltipTrigger>
      <TooltipContent>{tooltip}</TooltipContent>
    </UiTooltip>
  );
}

function CompactSchedule({ title, code, date }: { title: string; code: string; date: string }) {
  return (
    <div className="rounded-lg border px-2.5 py-2 sm:px-3">
      <p className="truncate text-xs font-medium sm:text-sm">{title}</p>
      <div className="mt-1 flex items-center justify-between gap-2 text-[11px] text-muted-foreground sm:text-xs">
        <span>{code}</span>
        <span>{date}</span>
      </div>
    </div>
  );
}

function buildMetrics(appointments: AdminAppointment[], workJobs: AdminWorkJob[], payments: AdminPayment[]) {
  const today = new Date().toISOString().slice(0, 10);
  const paidPayments = payments.filter((payment) => payment.status === "paid");
  const additionalChargePayments = paidPayments.filter((payment) => payment.type === "additional_charge");
  const allWorkJobItems = workJobs.flatMap((workJob) => workJob.quotation?.items ?? []);

  return {
    collectedRevenue: paidPayments.reduce((sum, payment) => sum + Number(payment.amount || 0), 0),
    paidPayments: paidPayments.length,
    additionalChargesPaid: additionalChargePayments.reduce((sum, payment) => sum + Number(payment.amount || 0), 0),
    openAppointments: appointments.filter((item) => !["completed", "cancelled", "no_show"].includes(item.status)).length,
    pendingAppointments: appointments.filter((item) => item.status === "pending").length,
    todayAppointments: appointments.filter((item) => item.appointment_date === today).length,
    todayWorkJobs: workJobs.filter((item) => item.scheduled_date === today).length,
    serviceRisks: appointments.filter((item) => ["cancelled", "no_show"].includes(item.status)).length,
    collectionsByMonth: collectionsByMonth(payments),
    statusData: statusData(appointments),
    workerLoad: workerLoad(appointments, workJobs),
    topProducts: topProducts(allWorkJobItems),
    upcomingAppointments: appointments
      .filter((item) => item.appointment_date && !["cancelled", "no_show", "completed"].includes(item.status))
      .sort((a, b) => String(a.appointment_date).localeCompare(String(b.appointment_date)))
      .slice(0, 4),
    activeWorkJobs: workJobs
      .filter((item) => !["cancelled", "completed"].includes(item.status))
      .sort((a, b) => String(a.scheduled_date).localeCompare(String(b.scheduled_date)))
      .slice(0, 4),
    serviceMix: serviceMix(appointments),
  };
}

function collectionsByMonth(payments: AdminPayment[]) {
  const grouped = new Map<string, { month: string; paid: number; pending: number }>();

  payments.forEach((payment) => {
    const month = String(payment.paid_at ?? payment.created_at).slice(0, 7);
    if (month.length < 7 || month === "null" || month === "undefined") return;
    if (!grouped.has(month)) grouped.set(month, { month, paid: 0, pending: 0 });
    const row = grouped.get(month)!;
    const amount = Number(payment.amount || 0);

    if (payment.status === "paid") row.paid += amount;
    if (payment.status === "pending") row.pending += amount;
  });

  return Array.from(grouped.values()).sort((a, b) => a.month.localeCompare(b.month)).slice(-6);
}

function statusData(appointments: AdminAppointment[]) {
  const grouped = new Map<string, number>();
  appointments.forEach((appointment) => grouped.set(appointment.status, (grouped.get(appointment.status) ?? 0) + 1));

  return Array.from(grouped.entries()).map(([status, count]) => ({
    status: adminStatusMeta[status as keyof typeof adminStatusMeta]?.label ?? status,
    count,
  }));
}

function workerLoad(appointments: AdminAppointment[], workJobs: AdminWorkJob[]) {
  const grouped = new Map<string, number>();
  [...appointments, ...workJobs].forEach((record) => {
    record.workers.forEach((worker) => grouped.set(worker.full_name, (grouped.get(worker.full_name) ?? 0) + 1));
  });

  return Array.from(grouped.entries())
    .map(([worker, jobs]) => ({ worker: worker.split(" ")[0] ?? worker, jobs }))
    .sort((a, b) => b.jobs - a.jobs)
    .slice(0, 6);
}

function topProducts(items: CustomerQuotationItem[] = []) {
  const grouped = new Map<string, number>();
  items.forEach((item) => grouped.set(item.name, (grouped.get(item.name) ?? 0) + 1));

  return Array.from(grouped.entries())
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);
}

function serviceMix(appointments: AdminAppointment[]) {
  const grouped = new Map<string, number>();
  appointments.forEach((appointment) => grouped.set(appointment.service_type, (grouped.get(appointment.service_type) ?? 0) + 1));

  return Array.from(grouped.entries())
    .map(([service, count]) => ({ service, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 6);
}

function peso(value: number) {
  return `₱${value.toLocaleString("en-PH", { maximumFractionDigits: 0 })}`;
}
