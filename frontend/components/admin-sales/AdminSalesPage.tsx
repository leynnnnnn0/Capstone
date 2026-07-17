"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { ComponentType } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Banknote,
  BriefcaseBusiness,
  CalendarRange,
  ChartNoAxesCombined,
  Download,
  FileSpreadsheet,
  FileText,
  Loader2,
  ReceiptText,
  RefreshCcw,
  Search,
  TrendingUp,
  WalletCards,
} from "lucide-react";
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

import { Badge } from "@/components/ui/badge";
import { AdminMobileRecord, AdminMobileRecordDetail } from "@/components/ui/admin-mobile-record";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { ChartContainer, ChartTooltipContent } from "@/components/ui/chart";
import type { ChartConfig } from "@/components/ui/chart";
import { Input } from "@/components/ui/input";
import { TableSkeletonRows } from "@/components/ui/page-skeletons";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { downloadSalesReport, fetchSalesReport, type SalesExportFormat } from "@/features/admin-sales/sales-api";
import {
  compactPeso,
  formatPercent,
  formatPeso,
  formatReportDate,
} from "@/features/admin-sales/sales-utils";
import type {
  SalesBreakdownPoint,
  SalesFilters,
  SalesPaymentRow,
  SalesReport,
  SalesTopCustomer,
  SalesTopProduct,
  SalesTopWorkJob,
} from "@/features/admin-sales/types";
import { cn } from "@/lib/utils";

const trendChartConfig = {
  sales: { label: "Paid", color: "#608DB9" },
  pending: { label: "Pending", color: "#9aabba" },
} satisfies ChartConfig;

const methodChartConfig = {
  value: { label: "Amount" },
} satisfies ChartConfig;

const productChartConfig = {
  revenue: { label: "Revenue", color: "#608DB9" },
} satisfies ChartConfig;

const PIE_COLORS = ["#162d4a", "#315b7d", "#608db9", "#83a8c5", "#a9c3d6", "#cbdbe7"];

export default function AdminSalesPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [report, setReport] = useState<SalesReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [exporting, setExporting] = useState<SalesExportFormat | null>(null);

  const filters = useMemo<SalesFilters>(
    () => ({
      date_from: searchParams.get("date_from") ?? "",
      date_to: searchParams.get("date_to") ?? "",
      group_by: searchParams.get("group_by") === "month" ? "month" : "day",
    }),
    [searchParams],
  );

  const loadReport = useCallback(
    (ignoreResult?: () => boolean) => {
      setLoading(true);
      setError(null);

      fetchSalesReport(filters)
        .then((nextReport) => {
          if (!ignoreResult?.()) setReport(nextReport);
        })
        .catch((nextError) => {
          if (!ignoreResult?.()) {
            setError(nextError instanceof Error ? nextError.message : "Unable to load the sales report.");
          }
        })
        .finally(() => {
          if (!ignoreResult?.()) setLoading(false);
        });
    },
    [filters],
  );

  useEffect(() => {
    let ignored = false;
    void Promise.resolve().then(() => loadReport(() => ignored));

    return () => {
      ignored = true;
    };
  }, [loadReport]);

  function applyFilter(next: SalesFilters) {
    const cleanNext = normalizeSalesDateRange(filters, next);
    const params = new URLSearchParams(searchParams.toString());

    Object.entries(cleanNext).forEach(([key, value]) => {
      if (!value) params.delete(key);
      else params.set(key, String(value));
    });

    router.push(`/dashboard/sales${params.toString() ? `?${params.toString()}` : ""}`);
  }

  function resetFilters() {
    router.push("/dashboard/sales");
  }

  function handleExport(format: SalesExportFormat) {
    setExporting(format);
    setError(null);

    downloadSalesReport(filters, format)
      .catch((nextError) => {
        setError(nextError instanceof Error ? nextError.message : "Unable to export the sales report.");
      })
      .finally(() => setExporting(null));
  }

  const hasExportRows = Boolean(report?.export_rows.length);
  const summary = report?.summary;
  const activeFilters = Boolean(filters.date_from || filters.date_to || filters.group_by === "month");

  return (
    <div className="space-y-5 lg:space-y-6">
      <div className="flex flex-col gap-4 rounded-[1.5rem] border border-white/10 bg-[#162d4a] p-5 text-white shadow-[0_18px_55px_rgba(22,45,74,0.12)] sm:p-6 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#b9cfe0]">Sales intelligence</p>
          <h1 className="mt-2 text-2xl font-semibold tracking-[-0.035em] text-white">Sales Report</h1>
          <p className="mt-1 text-sm text-white/55">
            Track paid sales, pending collections, outstanding balances, and top revenue drivers.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="outline" size="sm" className="gap-1.5 bg-white text-[#162d4a] hover:bg-[#edf3f7] hover:text-[#162d4a]" disabled={!hasExportRows || exporting !== null} onClick={() => handleExport("csv")}>
            {exporting === "csv" ? <Loader2 className="size-3.5 animate-spin" /> : <Download className="size-3.5" />}
            CSV
          </Button>
          <Button type="button" variant="outline" size="sm" className="gap-1.5 bg-white text-[#162d4a] hover:bg-[#edf3f7] hover:text-[#162d4a]" disabled={!hasExportRows || exporting !== null} onClick={() => handleExport("xlsx")}>
            {exporting === "xlsx" ? <Loader2 className="size-3.5 animate-spin" /> : <FileSpreadsheet className="size-3.5" />}
            Excel
          </Button>
          <Button type="button" variant="outline" size="sm" className="gap-1.5 bg-white text-[#162d4a] hover:bg-[#edf3f7] hover:text-[#162d4a]" disabled={!report || exporting !== null} onClick={() => handleExport("pdf")}>
            {exporting === "pdf" ? <Loader2 className="size-3.5 animate-spin" /> : <FileText className="size-3.5" />}
            PDF
          </Button>
          <Button type="button" variant="secondary" size="sm" className="gap-1.5" disabled={loading} onClick={() => loadReport()}>
            {loading ? <Loader2 className="size-3.5 animate-spin" /> : <RefreshCcw className="size-3.5" />}
            Refresh
          </Button>
        </div>
      </div>

      <Card className="border-transparent bg-white">
        <CardContent className="p-4 sm:p-5">
          <div className="grid gap-4 lg:grid-cols-[240px_minmax(0,1fr)] lg:items-end lg:gap-6">
            <div className="flex items-center gap-3 lg:pb-0.5">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-[#edf3f7] text-[#315b7d]">
                <CalendarRange className="size-4" />
              </span>
              <div>
                <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-[#7e94a7]">Report controls</p>
                <p className="mt-1 text-sm font-semibold text-[#162d4a]">Reporting period</p>
              </div>
            </div>
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_150px_auto]">
              <FilterDate label="From" value={filters.date_from ?? ""} onChange={(value) => applyFilter({ date_from: value })} />
              <FilterDate label="To" value={filters.date_to ?? ""} onChange={(value) => applyFilter({ date_to: value })} />
              <div className="space-y-1 sm:col-span-1">
                <label className="text-xs font-medium text-muted-foreground">Group By</label>
                <Select value={filters.group_by ?? "day"} onValueChange={(value) => applyFilter({ group_by: value as "day" | "month" })}>
                  <SelectTrigger className="h-9 w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="day">Daily</SelectItem>
                    <SelectItem value="month">Monthly</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-end sm:justify-end">
                <Button type="button" variant="ghost" size="sm" disabled={!activeFilters} onClick={resetFilters} className="gap-1.5">
                  <RefreshCcw className="size-3.5" />
                  Reset
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {error && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}

      <div className="grid grid-cols-2 gap-2 sm:gap-4 md:grid-cols-2 xl:grid-cols-7">
        <MetricCard label="Net Sales" value={formatPeso(summary?.net_sales ?? 0)} icon={TrendingUp} featured />
        <MetricCard label="Paid Sales" value={formatPeso(summary?.gross_sales ?? 0)} icon={WalletCards} />
        <MetricCard label="Outstanding" value={formatPeso(summary?.outstanding_amount ?? 0)} icon={BriefcaseBusiness} />
        <MetricCard label="Pending" value={formatPeso(summary?.pending_amount ?? 0)} icon={ReceiptText} />
        <MetricCard label="Extra Charges" value={formatPeso(summary?.additional_charges_paid ?? 0)} icon={Banknote} />
        <MetricCard label="Collection Rate" value={formatPercent(summary?.collection_rate ?? 0)} icon={ChartNoAxesCombined} />
      </div>

      <SalesSectionHeading
        eyebrow="Revenue performance"
        title="Understand how collections are moving."
        description="Compare paid and pending revenue, customer payment behavior, and the products driving each period."
      />

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.6fr)_minmax(320px,1fr)]">
        <Card className="border-transparent bg-white">
          <SalesPanelHeading
            eyebrow="Cash flow"
            title="Sales Trend"
            description={`Paid and pending amounts by ${filters.group_by === "month" ? "month" : "day"}.`}
            icon={TrendingUp}
          />
          <CardContent>
            <div className="rounded-[1.4rem] bg-[#f3f7fa] p-2 sm:p-4">
              {loading ? <ChartLoading /> : report?.charts.sales_by_period.length ? (
                <ChartContainer config={trendChartConfig} className="h-[220px] w-full sm:h-[240px] xl:h-[260px]">
                  <AreaChart data={report.charts.sales_by_period} margin={{ left: 0, right: 8, top: 12 }}>
                  <defs>
                    <linearGradient id="salesFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--color-sales)" stopOpacity={0.35} />
                      <stop offset="95%" stopColor="var(--color-sales)" stopOpacity={0.03} />
                    </linearGradient>
                    <linearGradient id="pendingFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--color-pending)" stopOpacity={0.28} />
                      <stop offset="95%" stopColor="var(--color-pending)" stopOpacity={0.03} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid vertical={false} strokeDasharray="4 4" />
                  <XAxis dataKey="period" tickLine={false} axisLine={false} tickMargin={8} />
                  <YAxis tickLine={false} axisLine={false} tickFormatter={compactPeso} width={42} />
                  <Tooltip content={<ChartTooltipContent />} />
                  <Area type="monotone" dataKey="sales" stroke="var(--color-sales)" fill="url(#salesFill)" strokeWidth={2} />
                  <Area type="monotone" dataKey="pending" stroke="var(--color-pending)" fill="url(#pendingFill)" strokeWidth={2} />
                  </AreaChart>
                </ChartContainer>
              ) : (
                <EmptyChart label="No sales trend yet." />
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="border-transparent bg-white">
          <SalesPanelHeading eyebrow="Channels" title="Payment Methods" description="Revenue split by payment channel." icon={WalletCards} />
          <CardContent>
            <div className="rounded-[1.4rem] bg-[#edf3f7] p-3 sm:p-4">
              {loading ? <ChartLoading /> : report?.charts.payment_methods.length ? (
                <div className="grid gap-3 md:grid-cols-[1fr_150px] xl:grid-cols-1 2xl:grid-cols-[1fr_150px]">
                <ChartContainer config={methodChartConfig} className="h-[200px] w-full sm:h-[220px]">
                  <PieChart>
                    <Tooltip content={<ChartTooltipContent />} />
                    <Pie
                      data={report.charts.payment_methods}
                      dataKey="value"
                      nameKey="method"
                      innerRadius={46}
                      outerRadius={76}
                      paddingAngle={2}
                    >
                      {report.charts.payment_methods.map((item, index) => (
                        <Cell key={item.method} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                  </PieChart>
                </ChartContainer>
                <BreakdownLegend data={report.charts.payment_methods} labelKey="method" />
                </div>
              ) : (
                <EmptyChart label="No paid methods yet." />
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <Card className="border-transparent bg-white">
          <SalesPanelHeading eyebrow="Collection mix" title="Payment Types" description="Full, down payment, balance, and additional charge collections." icon={ReceiptText} />
          <CardContent>
            <div className="rounded-[1.4rem] bg-[#f3f7fa] p-2 sm:p-4">
              {loading ? <ChartLoading /> : report?.charts.payment_types.length ? (
                <ChartContainer config={productChartConfig} className="h-[210px] w-full sm:h-[230px]">
                <BarChart data={report.charts.payment_types} margin={{ left: 0, right: 8, top: 12 }}>
                  <CartesianGrid vertical={false} strokeDasharray="4 4" />
                  <XAxis dataKey="type" tickLine={false} axisLine={false} tickMargin={8} />
                  <YAxis tickLine={false} axisLine={false} tickFormatter={compactPeso} width={42} />
                  <Tooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="value" fill="#608DB9" radius={[6, 6, 0, 0]} />
                </BarChart>
                </ChartContainer>
              ) : (
                <EmptyChart label="No payment types yet." />
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="border-transparent bg-white">
          <SalesPanelHeading eyebrow="Product demand" title="Top Products" description="Approved quotation items attached to paid work jobs." icon={BriefcaseBusiness} />
          <CardContent>
            <div className="rounded-[1.4rem] bg-[#edf3f7] p-2 sm:p-4">
              {loading ? <ChartLoading /> : report?.charts.top_products.length ? (
                <ChartContainer config={productChartConfig} className="h-[210px] w-full sm:h-[230px]">
                <BarChart data={report.charts.top_products} layout="vertical" margin={{ left: 0, right: 8, top: 12 }}>
                  <CartesianGrid horizontal={false} strokeDasharray="4 4" />
                  <XAxis type="number" tickLine={false} axisLine={false} tickFormatter={compactPeso} />
                  <YAxis type="category" dataKey="name" tickLine={false} axisLine={false} width={72} tickMargin={6} />
                  <Tooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="revenue" fill="var(--color-revenue)" radius={[0, 6, 6, 0]} />
                </BarChart>
                </ChartContainer>
              ) : (
                <EmptyChart label="No product revenue yet." />
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <SalesSectionHeading
        eyebrow="Revenue activity"
        title="Follow every collection that matters."
        description="Recent payments, leading customers, and balances that still need action."
      />

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.45fr)_minmax(320px,1fr)]">
        <RecentPaymentsTable payments={report?.tables.recent_payments ?? []} loading={loading} />
        <TopLists
          customers={report?.tables.top_customers ?? []}
          workJobs={report?.tables.top_work_jobs ?? []}
          products={report?.charts.top_products ?? []}
          loading={loading}
        />
      </div>

      <OutstandingTable rows={report?.tables.outstanding_work_jobs ?? []} loading={loading} />
    </div>
  );
}

function SalesSectionHeading({
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

function SalesPanelHeading({
  eyebrow,
  title,
  description,
  icon: Icon,
}: {
  eyebrow: string;
  title: string;
  description: string;
  icon: ComponentType<{ className?: string }>;
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

function MetricCard({
  label,
  value,
  icon: Icon,
  featured = false,
}: {
  label: string;
  value: string;
  icon: ComponentType<{ className?: string }>;
  featured?: boolean;
}) {
  const surface = featured
    ? "bg-[#dcecf8]"
    : label === "Outstanding" || label === "Collection Rate"
      ? "bg-[#e4eaf0]"
      : label === "Pending"
        ? "bg-[#f1f5f8]"
        : "bg-[#e8f0f6]";

  return (
    <article
      className={cn(
        "relative min-h-[104px] overflow-hidden rounded-xl p-3 text-[#17324d] shadow-[0_14px_38px_rgba(22,45,74,0.055)] sm:min-h-40 sm:rounded-[1.6rem] sm:p-6",
        surface,
        featured && "md:col-span-2 xl:col-span-2",
      )}
    >
      <div className="relative flex h-full min-h-20 flex-col justify-between gap-2 sm:min-h-28 sm:gap-6">
        <div className="flex items-start justify-between gap-2 sm:gap-3">
          <div>
            <p className="text-[7px] font-bold uppercase tracking-[0.12em] text-[#6f879b] sm:text-[9px] sm:tracking-[0.2em]">
              {featured ? "Revenue performance" : "Sales indicator"}
            </p>
            <h2 className="mt-1 text-[11px] font-semibold leading-tight sm:mt-2 sm:text-sm">{label}</h2>
          </div>
          <span className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-[#162d4a] text-white shadow-sm sm:size-10 sm:rounded-2xl">
            <Icon className="size-3.5 sm:size-4" />
          </span>
        </div>
        <p className={cn("truncate text-lg font-semibold tracking-[-0.05em]", featured ? "sm:text-4xl" : "sm:text-3xl")}>{value}</p>
        <Icon className="pointer-events-none absolute -bottom-3 -right-2 size-14 opacity-[0.05] sm:-bottom-6 sm:-right-4 sm:size-24" />
      </div>
    </article>
  );
}

function FilterDate({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return (
    <div className="space-y-1">
      <label className="text-xs font-medium text-muted-foreground">{label}</label>
      <div className="relative">
        <CalendarRange className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input type="date" className="h-9 pl-8" value={value} onChange={(event) => onChange(event.target.value)} />
      </div>
    </div>
  );
}

function ChartLoading() {
  return (
    <div className="flex h-[210px] items-end justify-center gap-3 rounded-lg bg-muted/35 p-4 sm:h-[230px]">
      {[48, 76, 58, 88, 66, 82].map((height, index) => (
        <Skeleton key={index} className="w-6 sm:w-8" style={{ height: `${height}%` }} />
      ))}
    </div>
  );
}

function EmptyChart({ label }: { label: string }) {
  return <div className="flex h-[210px] items-center justify-center rounded-lg border border-dashed text-xs text-muted-foreground sm:h-[230px] sm:text-sm">{label}</div>;
}

function normalizeSalesDateRange(current: SalesFilters, next: SalesFilters): SalesFilters {
  const dateFrom = next.date_from ?? current.date_from ?? "";
  const dateTo = next.date_to ?? current.date_to ?? "";

  if (!dateFrom || !dateTo || dateTo >= dateFrom) return next;

  return next.date_from !== undefined
    ? { ...next, date_to: dateFrom }
    : { ...next, date_from: dateTo };
}

function BreakdownLegend<T extends SalesBreakdownPoint>({ data, labelKey }: { data: T[]; labelKey: keyof T }) {
  return (
    <div className="space-y-2">
      {data.map((item, index) => (
        <div key={String(item[labelKey])} className="flex items-center justify-between gap-3 text-xs sm:text-sm">
          <div className="flex min-w-0 items-center gap-2">
            <span className="size-2.5 shrink-0 rounded-full" style={{ backgroundColor: PIE_COLORS[index % PIE_COLORS.length] }} />
            <span className="truncate">{String(item[labelKey])}</span>
          </div>
          <span className="font-medium">{formatPeso(item.value)}</span>
        </div>
      ))}
    </div>
  );
}

function RecentPaymentsTable({ payments, loading }: { payments: SalesPaymentRow[]; loading: boolean }) {
  return (
    <Card className="border-transparent bg-white">
      <SalesPanelHeading eyebrow="Latest activity" title="Recent Payments" description="Latest payment activity across work jobs." icon={Search} />
      <CardContent>
        <div className="space-y-2 md:hidden">
          {loading ? (
            Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className="h-28 animate-pulse rounded-lg border bg-muted/30" />
            ))
          ) : payments.length > 0 ? (
            payments.map((payment) => <RecentPaymentCard key={payment.id} payment={payment} />)
          ) : (
            <div className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
              No recent payments yet.
            </div>
          )}
        </div>
        <div className="hidden overflow-hidden rounded-xl border border-[#e1e8ed] md:block">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Payment</TableHead>
                <TableHead>Work Job</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Amount</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableSkeletonRows columns={4} rows={4} />
              ) : payments.length > 0 ? (
                payments.map((payment) => (
                  <TableRow key={payment.id}>
                    <TableCell>
                      <div className="space-y-1">
                        <p className="font-medium">{payment.payment_number ?? `PAY-${payment.id}`}</p>
                        <p className="text-xs text-muted-foreground">{payment.customer ?? payment.email ?? "-"}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      {payment.work_job_id ? (
                        <div className="space-y-1">
                          <Link href={`/dashboard/work-jobs/${payment.work_job_id}`} className="font-medium text-primary hover:underline">
                            {payment.work_job_number}
                          </Link>
                          <p className="text-xs text-muted-foreground">{payment.schedule ?? "-"}</p>
                        </div>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1">
                        <Badge variant="outline" className={cn("w-fit", statusClass(payment.status))}>{payment.status_label ?? "-"}</Badge>
                        <span className="text-xs text-muted-foreground">{payment.method_label ?? "-"} · {payment.type_label ?? "-"}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <p className="font-medium">{formatPeso(payment.amount)}</p>
                      <p className="text-xs text-muted-foreground">{formatReportDate(payment.recorded_at)}</p>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={4} className="py-8 text-center text-muted-foreground">No recent payments yet.</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}

function RecentPaymentCard({ payment }: { payment: SalesPaymentRow }) {
  return (
    <AdminMobileRecord>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold">{payment.payment_number ?? `PAY-${payment.id}`}</p>
          <p className="truncate text-xs text-muted-foreground">{payment.customer ?? payment.email ?? "-"}</p>
        </div>
        <div className="shrink-0 text-right">
          <p className="text-sm font-semibold">{formatPeso(payment.amount)}</p>
          <p className="text-xs text-muted-foreground">{formatReportDate(payment.recorded_at)}</p>
        </div>
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-1.5">
        <Badge variant="outline" className={cn("w-fit", statusClass(payment.status))}>{payment.status_label ?? "-"}</Badge>
        <span className="text-xs text-muted-foreground">{payment.method_label ?? "-"} · {payment.type_label ?? "-"}</span>
      </div>
      <AdminMobileRecordDetail className="mt-3 text-xs">
        <p className="text-muted-foreground">Work Job</p>
        {payment.work_job_id ? (
          <>
            <Link href={`/dashboard/work-jobs/${payment.work_job_id}`} className="font-medium text-primary hover:underline">
              {payment.work_job_number}
            </Link>
            <p className="text-muted-foreground">{payment.schedule ?? "-"}</p>
          </>
        ) : (
          <p className="font-medium">-</p>
        )}
      </AdminMobileRecordDetail>
    </AdminMobileRecord>
  );
}

function TopLists({
  customers,
  workJobs,
  products,
  loading,
}: {
  customers: SalesTopCustomer[];
  workJobs: SalesTopWorkJob[];
  products: SalesTopProduct[];
  loading: boolean;
}) {
  return (
    <Card className="border-transparent bg-white">
      <SalesPanelHeading eyebrow="Top performers" title="Revenue Leaders" description="Customers, work jobs, and products driving sales." icon={TrendingUp} />
      <CardContent className="grid gap-4">
        <TopListSection
          title="Top Customers"
          loading={loading}
          rows={customers.map((customer) => ({
            key: customer.name,
            label: customer.name,
            sublabel: `${customer.payments} payment${customer.payments === 1 ? "" : "s"}${customer.contact ? ` · ${customer.contact}` : ""}`,
            value: formatPeso(customer.total_paid),
          }))}
        />
        <TopListSection
          title="Top Work Jobs"
          loading={loading}
          rows={workJobs.map((workJob) => ({
            key: workJob.work_job_number,
            label: workJob.work_job_number,
            href: workJob.id ? `/dashboard/work-jobs/${workJob.id}` : undefined,
            sublabel: `${workJob.customer ?? "Unknown customer"}${workJob.schedule ? ` · ${workJob.schedule}` : ""}`,
            value: formatPeso(workJob.total_paid),
          }))}
        />
        <TopListSection
          title="Top Products"
          loading={loading}
          rows={products.map((product) => ({
            key: product.name,
            label: product.name,
            sublabel: `${product.pieces} pc${product.pieces === 1 ? "" : "s"} · ${product.line_count} line item${product.line_count === 1 ? "" : "s"}`,
            value: formatPeso(product.revenue),
          }))}
        />
      </CardContent>
    </Card>
  );
}

function TopListSection({
  title,
  rows,
  loading,
}: {
  title: string;
  rows: Array<{ key: string; label: string; sublabel: string; value: string; href?: string }>;
  loading: boolean;
}) {
  return (
    <div>
      <p className="mb-2 text-xs font-semibold uppercase tracking-[0.16em] text-primary">{title}</p>
      <div className="space-y-2">
        {loading ? (
          Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className="flex items-center justify-between gap-3 rounded-lg border px-3 py-2">
              <div className="space-y-2">
                <Skeleton className="h-4 w-28" />
                <Skeleton className="h-3 w-40" />
              </div>
              <Skeleton className="h-4 w-20" />
            </div>
          ))
        ) : rows.length > 0 ? (
          rows.slice(0, 4).map((row) => (
            <div key={row.key} className="flex items-start justify-between gap-3 rounded-xl border border-[#e3eaf0] bg-[#f6f9fb] px-3 py-2.5 transition-colors hover:bg-[#edf3f7]">
              <div className="min-w-0">
                {row.href ? (
                  <Link href={row.href} className="font-medium text-primary hover:underline">{row.label}</Link>
                ) : (
                  <p className="font-medium">{row.label}</p>
                )}
                <p className="line-clamp-1 text-xs text-muted-foreground">{row.sublabel}</p>
              </div>
              <p className="shrink-0 font-medium">{row.value}</p>
            </div>
          ))
        ) : (
          <div className="rounded-lg border border-dashed py-4 text-center text-sm text-muted-foreground">No data yet.</div>
        )}
      </div>
    </div>
  );
}

function OutstandingTable({
  rows,
  loading,
}: {
  rows: SalesReport["tables"]["outstanding_work_jobs"];
  loading: boolean;
}) {
  return (
    <Card className="border-transparent bg-white">
      <SalesPanelHeading
        eyebrow="Needs attention"
        title="Outstanding Balances"
        description="Work jobs that still need down payment, balance, or additional charge collection."
        icon={BriefcaseBusiness}
      />
      <CardContent>
        <div className="space-y-2 md:hidden">
          {loading ? (
            Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className="h-32 animate-pulse rounded-lg border bg-muted/30" />
            ))
          ) : rows.length > 0 ? (
            rows.map((row) => <OutstandingCard key={row.id} row={row} />)
          ) : (
            <div className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
              No outstanding balances.
            </div>
          )}
        </div>
        <div className="hidden overflow-hidden rounded-xl border border-[#e1e8ed] md:block">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Work Job</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Next Due</TableHead>
                <TableHead className="text-right">Paid</TableHead>
                <TableHead className="text-right">Remaining</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableSkeletonRows columns={5} rows={4} />
              ) : rows.length > 0 ? (
                rows.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell>
                      <div className="space-y-1">
                        <Link href={`/dashboard/work-jobs/${row.id}`} className="font-medium text-primary hover:underline">
                          {row.work_job_number}
                        </Link>
                        <div className="flex flex-wrap gap-1">
                          <Badge variant="outline">{row.status_label ?? "-"}</Badge>
                          {row.schedule && <span className="text-xs text-muted-foreground">{row.schedule}</span>}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{row.customer}</TableCell>
                    <TableCell>
                      <p className="font-medium">{row.next_due_type ? titleCase(row.next_due_type) : "Balance"}</p>
                      <p className="text-xs text-muted-foreground">{formatPeso(row.next_due_amount)}</p>
                    </TableCell>
                    <TableCell className="text-right">{formatPeso(row.paid_amount)}</TableCell>
                    <TableCell className="text-right font-medium">{formatPeso(row.remaining_amount)}</TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="py-8 text-center text-muted-foreground">No outstanding balances.</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}

function OutstandingCard({ row }: { row: SalesReport["tables"]["outstanding_work_jobs"][number] }) {
  return (
    <AdminMobileRecord>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <Link href={`/dashboard/work-jobs/${row.id}`} className="truncate text-sm font-semibold text-primary hover:underline">
            {row.work_job_number}
          </Link>
          <p className="truncate text-xs text-muted-foreground">{row.customer}</p>
        </div>
        <p className="shrink-0 text-sm font-semibold">{formatPeso(row.remaining_amount)}</p>
      </div>
      <div className="mt-3 flex flex-wrap gap-1.5">
        <Badge variant="outline">{row.status_label ?? "-"}</Badge>
        {row.schedule && <span className="text-xs text-muted-foreground">{row.schedule}</span>}
      </div>
      <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
        <AdminMobileRecordDetail>
          <p className="text-muted-foreground">Next Due</p>
          <p className="font-medium">{row.next_due_type ? titleCase(row.next_due_type) : "Balance"}</p>
          <p className="text-muted-foreground">{formatPeso(row.next_due_amount)}</p>
        </AdminMobileRecordDetail>
        <AdminMobileRecordDetail>
          <p className="text-muted-foreground">Paid</p>
          <p className="font-medium">{formatPeso(row.paid_amount)}</p>
        </AdminMobileRecordDetail>
      </div>
    </AdminMobileRecord>
  );
}

function statusClass(status?: string | null) {
  const classes: Record<string, string> = {
    paid: "border-emerald-200 bg-emerald-50 text-emerald-700",
    pending: "border-amber-200 bg-amber-50 text-amber-700",
    failed: "border-red-200 bg-red-50 text-red-700",
    refunded: "border-slate-200 bg-slate-50 text-slate-700",
  };

  return status ? classes[status] : undefined;
}

function titleCase(value: string) {
  return value
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}
