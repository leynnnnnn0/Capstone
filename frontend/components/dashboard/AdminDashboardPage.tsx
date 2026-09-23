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
import {
  CalendarCheck,
  CalendarPlus,
  CircleDollarSign,
  ClipboardList,
  Clock3,
  CreditCard,
  Package,
  ReceiptText,
  ShieldCheck,
  TriangleAlert,
  Wrench,
} from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
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
  paid: { label: "Paid Collections", color: "#608DB9" },
  pending: { label: "Pending Payments", color: "#9aabba" },
} satisfies ChartConfig;

const workloadChartConfig = {
  jobs: { label: "Assigned Jobs", color: "#608DB9" },
} satisfies ChartConfig;

const pieColors = ["#162d4a", "#315b7d", "#608db9", "#83a8c5", "#a9c3d6", "#cbdbe7"];

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
    <div className="space-y-10">
      <section className="flex flex-col gap-5 border-b pb-8 sm:gap-8 sm:pb-10 lg:flex-row lg:items-center lg:justify-between">
        <div className="max-w-3xl">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#64879a]">
            Business operations · Live overview
          </p>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight text-[#2d425b] sm:mt-4 sm:text-4xl">
            SOG administration
          </h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-[#71869c] sm:mt-4 sm:text-base sm:leading-7">
            Monitor customer appointments, field work, collections, and daily operations from one workspace.
          </p>
        </div>

        <div className="flex w-full flex-row items-center justify-between gap-4 lg:w-auto lg:flex-col lg:items-end lg:gap-5">
          <Button asChild size="lg" className="gap-2 bg-[#2d425b] hover:bg-[#23364b]">
            <Link href="/dashboard/appointments/create">
              <CalendarPlus className="size-4" />
              Create appointment
            </Link>
          </Button>
          <div className="hidden items-center gap-3 md:flex">
            <span className="flex size-10 items-center justify-center rounded-lg bg-[#eef4f7] text-[#64879a]">
              <ShieldCheck className="size-4" />
            </span>
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#8194a7]">Access</p>
              <p className="mt-0.5 text-sm font-semibold text-[#2d425b]">Administrator only</p>
            </div>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-2 gap-x-4 sm:gap-x-7 xl:grid-cols-4">
        <TooltipProvider>
          <MetricCard
            title="Collected Revenue"
            value={peso(metrics.collectedRevenue)}
            description="settled customer revenue"
            icon={CircleDollarSign}
            tooltip="Paid records from PayPal, cash, bank transfers, and additional charges."
          />
          <MetricCard
            title="Paid Payments"
            value={metrics.paidPayments.toString()}
            description="completed collections"
            icon={CreditCard}
            tooltip="Payments currently marked as paid."
          />
          <MetricCard
            title="Open Appointments"
            value={metrics.openAppointments.toString()}
            description="active customer bookings"
            icon={ClipboardList}
            tooltip="Appointments that are not completed, cancelled, or marked no show."
          />
          <MetricCard
            title="Pending Review"
            value={metrics.pendingAppointments.toString()}
            description="awaiting admin confirmation"
            icon={Clock3}
            tooltip="Appointment requests waiting for review."
          />
          <MetricCard
            title="Today's Schedule"
            value={metrics.todayAppointments.toString()}
            description="appointments scheduled today"
            icon={CalendarCheck}
            tooltip="Confirmed appointments and scheduled work jobs for today."
          />
          <MetricCard
            title="Work Jobs Today"
            value={metrics.todayWorkJobs.toString()}
            description="scheduled field work"
            icon={Wrench}
            tooltip="Work jobs scheduled for today."
          />
          <MetricCard
            title="No Show / Cancelled"
            value={metrics.serviceRisks.toString()}
            description="Bookings needing follow-up"
            icon={TriangleAlert}
            tooltip="Cancelled and no-show appointments that may need admin review."
          />
          <MetricCard
            title="Additional Charges"
            value={peso(metrics.additionalChargesPaid)}
            description="settled add-on charges"
            icon={ReceiptText}
            tooltip="Additional charges that have been paid."
          />
        </TooltipProvider>
      </section>

      <DashboardSectionHeading title="Performance" description="Revenue, appointments, and staff workload." />

      <div className="grid gap-4 xl:grid-cols-7">
        <Card className="xl:col-span-4">
          <DashboardPanelHeading
            title="Collections Trend"
            description="Paid collections versus pending payment requests by month."
            icon={CircleDollarSign}
          />
          <CardContent>
            <div className="rounded-md bg-muted/30 p-2 sm:p-4">
              <ChartContainer config={revenueChartConfig} className="h-[220px] sm:h-[240px] xl:h-[260px]">
                <AreaChart data={metrics.collectionsByMonth} margin={{ left: 0, right: 8, top: 12 }}>
                  <CartesianGrid vertical={false} strokeDasharray="3 3" />
                  <XAxis dataKey="month" tickLine={false} axisLine={false} />
                  <YAxis width={42} tickLine={false} axisLine={false} tickFormatter={(value) => `₱${Number(value) / 1000}k`} />
                  <Tooltip content={<ChartTooltipContent />} />
                  <Area dataKey="pending" type="monotone" fill="var(--color-pending)" fillOpacity={0.12} stroke="var(--color-pending)" />
                  <Area dataKey="paid" type="monotone" fill="var(--color-paid)" fillOpacity={0.2} stroke="var(--color-paid)" />
                </AreaChart>
              </ChartContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="xl:col-span-3">
          <DashboardPanelHeading
            title="Appointment Status"
            description="Current operational distribution."
            icon={ClipboardList}
          />
          <CardContent>
            <div className="rounded-md bg-muted/30 p-2 sm:p-4">
              <ChartContainer config={statusChartConfig} className="h-[220px] sm:h-[240px] xl:h-[260px]">
                <PieChart>
                  <Tooltip content={<ChartTooltipContent />} />
                  <Pie data={metrics.statusData} dataKey="count" nameKey="status" innerRadius={48} outerRadius={82} paddingAngle={3}>
                    {metrics.statusData.map((entry, index) => (
                      <Cell key={entry.status} fill={pieColors[index % pieColors.length]} />
                    ))}
                  </Pie>
                </PieChart>
              </ChartContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <Card>
          <DashboardPanelHeading
            title="Staff Load"
            description="Assigned appointments and work jobs."
            icon={Wrench}
          />
          <CardContent>
            <div className="rounded-md bg-muted/30 p-2 sm:p-4">
              <ChartContainer config={workloadChartConfig} className="h-[210px] sm:h-[230px]">
                <BarChart data={metrics.workerLoad} margin={{ left: 0, right: 8, top: 12 }}>
                  <CartesianGrid vertical={false} strokeDasharray="3 3" />
                  <XAxis dataKey="worker" tickLine={false} axisLine={false} />
                  <YAxis width={28} allowDecimals={false} tickLine={false} axisLine={false} />
                  <Tooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="jobs" fill="var(--color-jobs)" radius={[8, 8, 3, 3]} />
                </BarChart>
              </ChartContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <DashboardPanelHeading
            title="Top Work Job Products"
            description="Products appearing most often in customer work jobs."
            icon={Package}
          />
          <CardContent>
            <div className="space-y-2.5">
              {metrics.topProducts.length ? metrics.topProducts.map((item, index) => (
                <div key={item.name} className="flex items-center justify-between border-b px-1 py-3 last:border-0">
                  <div className="flex min-w-0 items-center gap-2.5 sm:gap-3">
                    <span className="w-5 shrink-0 text-xs tabular-nums text-muted-foreground">{index + 1}.</span>
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

      <DashboardSectionHeading title="Current operations" description="Upcoming appointments, active work jobs, and service demand." />

      <div className="grid gap-4 xl:grid-cols-3">
        <Card>
          <DashboardPanelHeading title="Upcoming Appointments" description="Next confirmed schedules." icon={CalendarCheck} />
          <CardContent className="space-y-2.5">
            {metrics.upcomingAppointments.map((appointment) => (
              <CompactSchedule key={appointment.id} title={appointment.full_name} code={appointment.appointment_number} date={formatAdminDate(appointment.appointment_date)} />
            ))}
          </CardContent>
        </Card>

        <Card>
          <DashboardPanelHeading title="Active Work Jobs" description="Installations and field work in motion." icon={Wrench} />
          <CardContent className="space-y-2.5">
            {metrics.activeWorkJobs.map((job) => (
              <CompactSchedule key={job.id} title={job.full_name} code={job.work_job_number} date={formatAdminDate(job.scheduled_date)} />
            ))}
          </CardContent>
        </Card>

        <Card>
          <DashboardPanelHeading title="Service Mix" description="Demand by requested service type." icon={Package} />
          <CardContent className="space-y-2">
            {metrics.serviceMix.map((item) => (
              <div key={item.service} className="rounded-xl bg-[#f6f9fb] px-3 py-2.5">
                <div className="flex items-center justify-between text-xs sm:text-sm">
                  <span className="capitalize text-[#617689]">{item.service.replaceAll("_", " ")}</span>
                  <span className="font-semibold text-[#162d4a]">{item.count}</span>
                </div>
                <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-[#dfe8ef]">
                  <div
                    className="h-full rounded-full bg-[#608db9]"
                    style={{ width: `${Math.max(10, (item.count / Math.max(...metrics.serviceMix.map((entry) => entry.count), 1)) * 100)}%` }}
                  />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function DashboardSectionHeading({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div>
      <h2 className="text-xl font-semibold tracking-tight">{title}</h2>
      <p className="mt-1 text-sm text-muted-foreground">{description}</p>
    </div>
  );
}

function DashboardPanelHeading({
  title,
  description,
  icon: Icon,
}: {
  title: string;
  description: string;
  icon: typeof Wrench;
}) {
  return (
    <CardHeader>
      <div className="flex items-center gap-2">
        <Icon className="size-4 text-muted-foreground" />
        <h3 className="text-base font-semibold">{title}</h3>
      </div>
      <p className="text-sm text-muted-foreground">{description}</p>
    </CardHeader>
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

      <div className="grid grid-cols-2 gap-x-4 sm:gap-x-7 xl:grid-cols-4">
        {Array.from({ length: 8 }).map((_, index) => (
          <div key={index} className="border-t py-6">
            <Skeleton className="h-3 w-20" />
            <Skeleton className="mt-3 h-4 w-28" />
            <Skeleton className="mt-2 h-8 w-20" />
            <Skeleton className="mt-2 h-3 w-32 max-w-full" />
          </div>
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
        <article className="min-h-28 border-t py-4 text-left sm:min-h-40 sm:py-6">
          <div className="flex items-start justify-between gap-2 sm:gap-4">
            <div>
              <p className="text-[9px] font-semibold uppercase tracking-[0.14em] text-[#8194a7] sm:text-[10px] sm:tracking-[0.16em]">Operations</p>
              <h2 className="mt-2 text-xs font-medium leading-4 text-[#496078] sm:mt-3 sm:text-sm">{title}</h2>
            </div>
            <Icon className="mt-0.5 size-4 shrink-0 text-[#64879a] sm:size-[18px]" />
          </div>
          <div className="mt-1 truncate text-2xl font-semibold tracking-tight text-[#2d425b] sm:text-3xl">{value}</div>
          <p className="mt-1.5 line-clamp-2 text-[11px] leading-4 text-[#64879a] sm:mt-2 sm:line-clamp-1 sm:text-xs">{description}</p>
        </article>
      </TooltipTrigger>
      <TooltipContent>{tooltip}</TooltipContent>
    </UiTooltip>
  );
}

function CompactSchedule({ title, code, date }: { title: string; code: string; date: string }) {
  return (
    <div className="border-b px-1 py-3 last:border-0">
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
