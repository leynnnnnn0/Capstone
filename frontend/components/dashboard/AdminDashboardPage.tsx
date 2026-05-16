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
import {
  Tooltip as UiTooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { fetchAdminAppointments } from "@/features/admin-appointments/admin-appointment-api";
import { adminStatusMeta, formatAdminDate } from "@/features/admin-appointments/admin-appointment-utils";
import type { AdminAppointment } from "@/features/admin-appointments/types";
import { fetchAdminWorkJobs } from "@/features/admin-work-jobs/admin-work-job-api";
import type { AdminWorkJob } from "@/features/admin-work-jobs/types";
import type { CustomerQuotationItem } from "@/features/customer/types";
import { fetchProducts } from "@/features/products/product-api";
import type { Product } from "@/features/products/types";

const statusChartConfig = {
  count: { label: "Appointments", color: "#5f87b5" },
} satisfies ChartConfig;

const revenueChartConfig = {
  approved: { label: "Approved Quote", color: "#0f8a4b" },
  pipeline: { label: "Quote Pipeline", color: "#d49b25" },
} satisfies ChartConfig;

const workloadChartConfig = {
  jobs: { label: "Assigned Jobs", color: "#7a5af8" },
} satisfies ChartConfig;

const pieColors = ["#5f87b5", "#0f8a4b", "#d49b25", "#c2410c", "#7a5af8", "#64748b"];

export default function AdminDashboardPage() {
  const [appointments, setAppointments] = useState<AdminAppointment[]>([]);
  const [workJobs, setWorkJobs] = useState<AdminWorkJob[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetchAdminAppointments({ per_page: "250" }),
      fetchAdminWorkJobs({ per_page: "250" }),
      fetchProducts({ per_page: "250" }),
    ])
      .then(([appointmentResponse, workJobResponse, productResponse]) => {
        setAppointments(appointmentResponse.data);
        setWorkJobs(workJobResponse.data);
        setProducts(productResponse.data);
      })
      .finally(() => setLoading(false));
  }, []);

  const metrics = useMemo(() => buildMetrics(appointments, workJobs, products), [appointments, workJobs, products]);

  if (loading) {
    return <div className="rounded-lg border bg-card p-6 text-sm text-muted-foreground">Loading dashboard...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-semibold uppercase tracking-widest text-primary">Business Overview</p>
        <h1 className="mt-2 text-xl font-semibold tracking-tight">Dashboard</h1>
        <p className="mt-1 text-sm text-muted-foreground">Appointments, revenue pipeline, workload, and operational risks.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <TooltipProvider>
          <MetricCard
            title="Approved Revenue"
            value={peso(metrics.approvedRevenue)}
            description={`${metrics.approvedItems} approved quote items`}
            icon={CircleDollarSign}
            tooltip="Total value from quotation items marked approved."
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

      <div className="grid gap-4 xl:grid-cols-7">
        <Card className="xl:col-span-4">
          <CardHeader>
            <CardTitle className="text-base">Revenue Pipeline</CardTitle>
            <CardDescription>Approved totals versus open quotation value by month.</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={revenueChartConfig} className="h-[280px]">
              <AreaChart data={metrics.revenueByMonth}>
                <CartesianGrid vertical={false} strokeDasharray="3 3" />
                <XAxis dataKey="month" tickLine={false} axisLine={false} />
                <YAxis tickLine={false} axisLine={false} tickFormatter={(value) => `₱${Number(value) / 1000}k`} />
                <Tooltip content={<ChartTooltipContent />} />
                <Area dataKey="pipeline" type="monotone" fill="var(--color-pipeline)" fillOpacity={0.18} stroke="var(--color-pipeline)" />
                <Area dataKey="approved" type="monotone" fill="var(--color-approved)" fillOpacity={0.22} stroke="var(--color-approved)" />
              </AreaChart>
            </ChartContainer>
          </CardContent>
        </Card>

        <Card className="xl:col-span-3">
          <CardHeader>
            <CardTitle className="text-base">Appointment Status</CardTitle>
            <CardDescription>Current operational distribution.</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={statusChartConfig} className="h-[280px]">
              <PieChart>
                <Tooltip content={<ChartTooltipContent />} />
                <Pie data={metrics.statusData} dataKey="count" nameKey="status" innerRadius={55} outerRadius={92} paddingAngle={2}>
                  {metrics.statusData.map((entry, index) => (
                    <Cell key={entry.status} fill={pieColors[index % pieColors.length]} />
                  ))}
                </Pie>
              </PieChart>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Worker Load</CardTitle>
            <CardDescription>Assigned appointments and work jobs.</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={workloadChartConfig} className="h-[260px]">
              <BarChart data={metrics.workerLoad}>
                <CartesianGrid vertical={false} strokeDasharray="3 3" />
                <XAxis dataKey="worker" tickLine={false} axisLine={false} />
                <YAxis allowDecimals={false} tickLine={false} axisLine={false} />
                <Tooltip content={<ChartTooltipContent />} />
                <Bar dataKey="jobs" fill="var(--color-jobs)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Top Quoted Products</CardTitle>
            <CardDescription>Most requested quotation line items.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {metrics.topProducts.length ? metrics.topProducts.map((item, index) => (
                <div key={item.name} className="flex items-center justify-between rounded-lg border px-3 py-2">
                  <div className="flex items-center gap-3">
                    <span className="flex size-7 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">{index + 1}</span>
                    <div>
                      <p className="text-sm font-medium">{item.name}</p>
                      <p className="text-xs text-muted-foreground">{item.count} quote item{item.count === 1 ? "" : "s"}</p>
                    </div>
                  </div>
                  <Package className="size-4 text-muted-foreground" />
                </div>
              )) : (
                <p className="text-sm text-muted-foreground">No quotation items yet.</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Upcoming Appointments</CardTitle>
            <CardDescription>Next confirmed schedules.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {metrics.upcomingAppointments.map((appointment) => (
              <CompactSchedule key={appointment.id} title={appointment.full_name} code={appointment.appointment_number} date={formatAdminDate(appointment.appointment_date)} />
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Active Work Jobs</CardTitle>
            <CardDescription>Installations and field work in motion.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {metrics.activeWorkJobs.map((job) => (
              <CompactSchedule key={job.id} title={job.full_name} code={job.work_job_number} date={formatAdminDate(job.scheduled_date)} />
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Service Mix</CardTitle>
            <CardDescription>Demand by requested service type.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {metrics.serviceMix.map((item) => (
              <div key={item.service} className="flex items-center justify-between text-sm">
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
            <div className="text-2xl font-semibold">{value}</div>
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
    <div className="rounded-lg border px-3 py-2">
      <p className="text-sm font-medium">{title}</p>
      <div className="mt-1 flex items-center justify-between gap-3 text-xs text-muted-foreground">
        <span>{code}</span>
        <span>{date}</span>
      </div>
    </div>
  );
}

function buildMetrics(appointments: AdminAppointment[], workJobs: AdminWorkJob[], products: Product[]) {
  const today = new Date().toISOString().slice(0, 10);
  const allQuoteItems = appointments.flatMap((appointment) => appointment.quotation?.items ?? []);
  const approvedItems = allQuoteItems.filter((item) => item.status === "approved");
  const approvedRevenue = approvedItems.reduce((sum, item) => sum + Number(item.total_amount || 0), 0);
  const pipelineRevenue = allQuoteItems.reduce((sum, item) => sum + Number(item.total_amount || 0), 0);

  return {
    approvedRevenue,
    approvedItems: approvedItems.length,
    openAppointments: appointments.filter((item) => !["completed", "cancelled", "no_show"].includes(item.status)).length,
    pendingAppointments: appointments.filter((item) => item.status === "pending").length,
    todayAppointments: appointments.filter((item) => item.appointment_date === today).length,
    todayWorkJobs: workJobs.filter((item) => item.scheduled_date === today).length,
    serviceRisks: appointments.filter((item) => ["cancelled", "no_show"].includes(item.status)).length,
    revenueByMonth: revenueByMonth(appointments),
    statusData: statusData(appointments),
    workerLoad: workerLoad(appointments, workJobs),
    topProducts: topProducts(allQuoteItems),
    upcomingAppointments: appointments
      .filter((item) => item.appointment_date && !["cancelled", "no_show", "completed"].includes(item.status))
      .sort((a, b) => String(a.appointment_date).localeCompare(String(b.appointment_date)))
      .slice(0, 4),
    activeWorkJobs: workJobs
      .filter((item) => !["cancelled", "completed"].includes(item.status))
      .sort((a, b) => String(a.scheduled_date).localeCompare(String(b.scheduled_date)))
      .slice(0, 4),
    serviceMix: serviceMix(appointments),
    productCount: products.length,
    pipelineRevenue,
  };
}

function revenueByMonth(appointments: AdminAppointment[]) {
  const grouped = new Map<string, { month: string; approved: number; pipeline: number }>();

  appointments.forEach((appointment) => {
    const month = String(appointment.created_at ?? appointment.preferred_date).slice(0, 7);
    if (!grouped.has(month)) grouped.set(month, { month, approved: 0, pipeline: 0 });
    const row = grouped.get(month)!;

    appointment.quotation?.items.forEach((item) => {
      const amount = Number(item.total_amount || 0);
      row.pipeline += amount;
      if (item.status === "approved") row.approved += amount;
    });
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
