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
import { cn } from "@/lib/utils";

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
    <div className="space-y-5 lg:space-y-6">
      <div className="relative overflow-hidden rounded-[1.75rem] bg-[#162d4a] px-5 py-8 text-white shadow-[0_24px_70px_rgba(22,45,74,0.14)] sm:px-8 sm:py-10 lg:px-10">
        <div className="absolute -right-16 -top-24 size-72 rounded-full bg-[#608db9]/30 blur-3xl" />
        <div className="absolute bottom-0 right-[18%] h-28 w-px bg-gradient-to-t from-white/15 to-transparent" />
        <div className="relative flex flex-col gap-7 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-[#b9cfe0]">SOG Operations · Live overview</p>
            <h1 className="mt-4 text-3xl font-medium leading-[1.02] tracking-[-0.045em] sm:text-4xl lg:text-5xl">
              Business at a glance.
            </h1>
            <p className="mt-4 max-w-xl text-sm leading-6 text-white/55 sm:text-base">
              Monitor collections, field schedules, workload, and customer service risks from one focused workspace.
            </p>
          </div>
          <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.06] px-4 py-3 backdrop-blur-sm">
            <span className="flex size-10 items-center justify-center rounded-xl bg-white text-[#162d4a]">
              <Wrench className="size-4" />
            </span>
            <div>
              <p className="text-[9px] font-bold uppercase tracking-[0.18em] text-white/40">Workspace</p>
              <p className="mt-0.5 text-sm font-medium">Admin command center</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <TooltipProvider>
          <MetricCard
            title="Collected Revenue"
            value={peso(metrics.collectedRevenue)}
            description={`${metrics.paidPayments} paid payments · ${peso(metrics.additionalChargesPaid)} add-ons`}
            icon={CircleDollarSign}
            tooltip="Paid records from PayPal, cash, bank transfers, and additional charges."
            tone="blue"
            featured
          />
          <MetricCard
            title="Open Appointments"
            value={metrics.openAppointments.toString()}
            description={`${metrics.pendingAppointments} pending review`}
            icon={ClipboardList}
            tooltip="Appointments that are not completed, cancelled, or marked no show."
            tone="mist"
          />
          <MetricCard
            title="Today's Schedule"
            value={metrics.todayAppointments.toString()}
            description={`${metrics.todayWorkJobs} work jobs today`}
            icon={CalendarCheck}
            tooltip="Confirmed appointments and scheduled work jobs for today."
            tone="light"
          />
          <MetricCard
            title="No Show / Cancelled"
            value={metrics.serviceRisks.toString()}
            description="Bookings needing follow-up"
            icon={TriangleAlert}
            tooltip="Cancelled and no-show appointments that may need admin review."
            tone="slate"
          />
        </TooltipProvider>
      </div>

      <DashboardSectionHeading
        eyebrow="Performance & capacity"
        title="See where the business is moving."
        description="Revenue flow, appointment distribution, and team capacity in one operational view."
      />

      <div className="grid gap-4 xl:grid-cols-7">
        <Card className="border-transparent bg-white xl:col-span-4">
          <DashboardPanelHeading
            eyebrow="Cash flow"
            title="Collections Trend"
            description="Paid collections versus pending payment requests by month."
            icon={CircleDollarSign}
          />
          <CardContent>
            <div className="rounded-[1.4rem] bg-[#f3f7fa] p-2 sm:p-4">
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

        <Card className="border-transparent bg-white xl:col-span-3">
          <DashboardPanelHeading
            eyebrow="Pipeline"
            title="Appointment Status"
            description="Current operational distribution."
            icon={ClipboardList}
          />
          <CardContent>
            <div className="rounded-[1.4rem] bg-[#edf3f7] p-2 sm:p-4">
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
        <Card className="border-transparent bg-white">
          <DashboardPanelHeading
            eyebrow="Team capacity"
            title="Worker Load"
            description="Assigned appointments and work jobs."
            icon={Wrench}
          />
          <CardContent>
            <div className="rounded-[1.4rem] bg-[#f3f7fa] p-2 sm:p-4">
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

        <Card className="border-transparent bg-white">
          <DashboardPanelHeading
            eyebrow="Product demand"
            title="Top Work Job Products"
            description="Products appearing most often in customer work jobs."
            icon={Package}
          />
          <CardContent>
            <div className="space-y-2.5">
              {metrics.topProducts.length ? metrics.topProducts.map((item, index) => (
                <div key={item.name} className="flex items-center justify-between rounded-xl border border-[#e3eaf0] bg-[#f6f9fb] px-3 py-3 transition-colors hover:bg-[#edf3f7]">
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

      <DashboardSectionHeading
        eyebrow="Today & next"
        title="Keep the operation moving."
        description="The next customer commitments, active installations, and service demand at a glance."
      />

      <div className="grid gap-4 xl:grid-cols-3">
        <Card className="border-transparent bg-white">
          <DashboardPanelHeading eyebrow="Schedule" title="Upcoming Appointments" description="Next confirmed schedules." icon={CalendarCheck} />
          <CardContent className="space-y-2.5">
            {metrics.upcomingAppointments.map((appointment) => (
              <CompactSchedule key={appointment.id} title={appointment.full_name} code={appointment.appointment_number} date={formatAdminDate(appointment.appointment_date)} />
            ))}
          </CardContent>
        </Card>

        <Card className="border-transparent bg-white">
          <DashboardPanelHeading eyebrow="In the field" title="Active Work Jobs" description="Installations and field work in motion." icon={Wrench} />
          <CardContent className="space-y-2.5">
            {metrics.activeWorkJobs.map((job) => (
              <CompactSchedule key={job.id} title={job.full_name} code={job.work_job_number} date={formatAdminDate(job.scheduled_date)} />
            ))}
          </CardContent>
        </Card>

        <Card className="border-transparent bg-white">
          <DashboardPanelHeading eyebrow="Demand" title="Service Mix" description="Demand by requested service type." icon={Package} />
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
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description: string;
}) {
  return (
    <div className="flex flex-col gap-2 px-1 pt-2 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <p className="text-[9px] font-bold uppercase tracking-[0.22em] text-[#608db9]">{eyebrow}</p>
        <h2 className="mt-2 text-xl font-semibold tracking-[-0.035em] text-[#162d4a] sm:text-2xl">{title}</h2>
      </div>
      <p className="max-w-xl text-xs leading-5 text-[#728596] sm:text-right sm:text-sm">{description}</p>
    </div>
  );
}

function DashboardPanelHeading({
  eyebrow,
  title,
  description,
  icon: Icon,
}: {
  eyebrow: string;
  title: string;
  description: string;
  icon: typeof Wrench;
}) {
  return (
    <CardHeader className="flex-row items-start justify-between gap-4">
      <div className="min-w-0">
        <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-[#7e94a7]">{eyebrow}</p>
        <h3 className="mt-2 text-base font-semibold tracking-[-0.025em] text-[#162d4a] sm:text-lg">{title}</h3>
        <p className="mt-1 text-xs leading-5 text-[#7b8d9c] sm:text-sm">{description}</p>
      </div>
      <span className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-[#edf3f7] text-[#315b7d]">
        <Icon className="size-4" />
      </span>
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
  tone = "blue",
  featured = false,
}: {
  title: string;
  value: string;
  description: string;
  icon: typeof Wrench;
  tooltip: string;
  tone?: "blue" | "mist" | "light" | "slate";
  featured?: boolean;
}) {
  const toneClasses = {
    blue: {
      surface: "bg-[#dcecf8] text-[#17324d]",
      icon: "bg-[#162d4a] text-white",
      muted: "text-[#5d7890]",
      glow: "bg-[#8db3cf]/35",
    },
    mist: {
      surface: "bg-[#e8f0f6] text-[#1e354b]",
      icon: "bg-[#315b7d] text-white",
      muted: "text-[#657b8f]",
      glow: "bg-[#8db3cf]/25",
    },
    light: {
      surface: "bg-[#f1f5f8] text-[#203448]",
      icon: "bg-[#608db9] text-white",
      muted: "text-[#708394]",
      glow: "bg-[#a8c5da]/25",
    },
    slate: {
      surface: "bg-[#e4eaf0] text-[#1f3142]",
      icon: "bg-[#405a70] text-white",
      muted: "text-[#687b8b]",
      glow: "bg-[#839caf]/20",
    },
  } as const;
  const palette = toneClasses[tone];

  return (
    <UiTooltip>
      <TooltipTrigger asChild>
        <article
          className={cn(
            "group relative min-h-48 overflow-hidden rounded-[1.75rem] p-5 text-left shadow-[0_16px_44px_rgba(22,45,74,0.06)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_24px_65px_rgba(22,45,74,0.12)] sm:p-6",
            palette.surface,
            featured && "md:col-span-2 xl:col-span-2",
          )}
        >
          <span className={cn("absolute -bottom-16 -right-12 size-48 rounded-full blur-2xl", palette.glow)} />
          <div className="relative flex h-full min-h-36 flex-col justify-between gap-7">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-[9px] font-bold uppercase tracking-[0.2em] opacity-55">
                  {featured ? "Financial performance" : "Live operations"}
                </p>
                <h2 className="mt-2 text-sm font-semibold">{title}</h2>
              </div>
              <span className={cn("flex size-11 shrink-0 items-center justify-center rounded-2xl shadow-sm", palette.icon)}>
                <Icon className="size-5" />
              </span>
            </div>
            <div className="relative">
              <div className={cn("font-semibold tracking-[-0.05em]", featured ? "text-4xl sm:text-5xl" : "text-3xl sm:text-4xl")}>{value}</div>
              <p className={cn("mt-2 text-xs leading-5", palette.muted)}>{description}</p>
            </div>
            <Icon className="pointer-events-none absolute -bottom-5 -right-3 size-24 opacity-[0.055]" strokeWidth={1.2} />
          </div>
        </article>
      </TooltipTrigger>
      <TooltipContent>{tooltip}</TooltipContent>
    </UiTooltip>
  );
}

function CompactSchedule({ title, code, date }: { title: string; code: string; date: string }) {
  return (
    <div className="rounded-xl border border-[#e1e8ed] bg-[#f8fafb] px-3 py-2.5 transition-colors hover:bg-[#edf3f7]">
      <p className="truncate text-xs font-semibold text-[#26384a] sm:text-sm">{title}</p>
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
