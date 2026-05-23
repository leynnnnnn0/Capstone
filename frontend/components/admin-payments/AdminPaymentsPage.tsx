"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { ComponentType } from "react";
import type { ReactNode } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  AlertCircle,
  Banknote,
  CreditCard,
  Eye,
  ReceiptText,
  RotateCcw,
  Search,
  SlidersHorizontal,
  WalletCards,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PaginationControls } from "@/components/ui/pagination-controls";
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
import { fetchAdminPayments } from "@/features/admin-payments/admin-payment-api";
import {
  defaultPaymentMethodOptions,
  defaultPaymentStatusOptions,
  defaultPaymentTypeOptions,
  formatPaymentDate,
  formatPaymentSchedule,
  formatPeso,
  paymentMethodStyle,
  paymentStatusStyle,
  paymentTypeStyle,
} from "@/features/admin-payments/admin-payment-utils";
import type {
  AdminPayment,
  AdminPaymentCollection,
  AdminPaymentOption,
} from "@/features/admin-payments/types";
import type {
  CustomerPaymentMethod,
  CustomerPaymentStatus,
  CustomerPaymentType,
} from "@/features/customer/types";
import { useRealtimeRefresh } from "@/hooks/use-realtime";
import { cn } from "@/lib/utils";

export default function AdminPaymentsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [response, setResponse] = useState<AdminPaymentCollection | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [search, setSearch] = useState(searchParams.get("search") ?? "");

  const filters = useMemo(
    () => ({
      search: searchParams.get("search") ?? "",
      status: searchParams.get("status") ?? "all",
      method: searchParams.get("method") ?? "all",
      type: searchParams.get("type") ?? "all",
      date_from: searchParams.get("date_from") ?? "",
      date_to: searchParams.get("date_to") ?? "",
      page: searchParams.get("page") ?? "1",
      per_page: searchParams.get("per_page") ?? "15",
    }),
    [searchParams],
  );

  const loadPayments = useCallback(
    (ignoreResult?: () => boolean) => {
      setLoading(true);
      setError(null);

      fetchAdminPayments(filters)
        .then((nextResponse) => {
          if (!ignoreResult?.()) setResponse(nextResponse);
        })
        .catch((nextError) => {
          if (!ignoreResult?.()) {
            setError(nextError instanceof Error ? nextError.message : "Unable to load payments.");
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
    loadPayments(() => ignored);

    return () => {
      ignored = true;
    };
  }, [loadPayments]);

  useRealtimeRefresh(() => loadPayments(), ["payment", "work_job"]);

  function applyFilter(next: Record<string, string>, options: { resetPage?: boolean } = {}) {
    const params = new URLSearchParams(searchParams.toString());

    Object.entries(next).forEach(([key, value]) => {
      if (!value || value === "all") params.delete(key);
      else params.set(key, value);
    });

    if (options.resetPage !== false) params.delete("page");

    router.push(`/dashboard/payments${params.toString() ? `?${params.toString()}` : ""}`);
  }

  function resetFilters() {
    setSearch("");
    router.push("/dashboard/payments");
  }

  const payments = response?.data ?? [];
  const meta = response?.meta;
  const summary = response?.summary;
  const total = summary?.total_count ?? meta?.total ?? payments.length;
  const statusOptions = optionList(response?.options.statuses, defaultPaymentStatusOptions);
  const methodOptions = optionList(response?.options.methods, defaultPaymentMethodOptions);
  const typeOptions = optionList(response?.options.types, defaultPaymentTypeOptions);
  const activeFilters = Boolean(
    filters.search ||
      filters.status !== "all" ||
      filters.method !== "all" ||
      filters.type !== "all" ||
      filters.date_from ||
      filters.date_to,
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">Payments</p>
          <h1 className="text-xl font-semibold tracking-tight">Payment Records</h1>
          <p className="text-sm text-muted-foreground">
            {total} payment record{total === 1 ? "" : "s"} across customer work jobs.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        <StatCard label="Total Paid" value={formatPeso(summary?.total_paid ?? 0)} icon={WalletCards} />
        <StatCard label="Paid" value={summary?.paid_count ?? 0} icon={CreditCard} />
        <StatCard label="Pending" value={summary?.pending_count ?? 0} icon={ReceiptText} />
        <StatCard label="Failed" value={summary?.failed_count ?? 0} icon={AlertCircle} />
        <StatCard label="Refunded" value={summary?.refunded_count ?? 0} icon={Banknote} />
      </div>

      <div className="rounded-lg border bg-card p-3">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search payment #, capture ID, customer, work job..."
              className="pl-8"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") applyFilter({ search });
              }}
            />
          </div>
          <Button type="button" size="sm" onClick={() => applyFilter({ search })}>
            Search
          </Button>
          <Button
            type="button"
            variant={filtersOpen ? "secondary" : "outline"}
            size="sm"
            onClick={() => setFiltersOpen((value) => !value)}
            className="gap-1.5"
          >
            <SlidersHorizontal className="size-3.5" />
            Filters
          </Button>
          {activeFilters && (
            <Button type="button" variant="ghost" size="sm" onClick={resetFilters} className="gap-1.5">
              <RotateCcw className="size-3.5" />
              Reset
            </Button>
          )}
        </div>

        {filtersOpen && (
          <div className="mt-3 grid gap-2 border-t pt-3 sm:grid-cols-2 lg:grid-cols-5">
            <FilterSelect label="Status" value={filters.status} options={statusOptions} onChange={(value) => applyFilter({ status: value })} />
            <FilterSelect label="Method" value={filters.method} options={methodOptions} onChange={(value) => applyFilter({ method: value })} />
            <FilterSelect label="Type" value={filters.type} options={typeOptions} onChange={(value) => applyFilter({ type: value })} />
            <FilterDate label="Date From" value={filters.date_from} onChange={(value) => applyFilter({ date_from: value })} />
            <FilterDate label="Date To" value={filters.date_to} onChange={(value) => applyFilter({ date_to: value })} />
          </div>
        )}
      </div>

      <div className="overflow-hidden rounded-lg border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Payment</TableHead>
              <TableHead>Work Job</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Method</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Amount</TableHead>
              <TableHead>Recorded</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={9} className="py-8 text-center text-muted-foreground">
                  Loading payments...
                </TableCell>
              </TableRow>
            ) : error ? (
              <TableRow>
                <TableCell colSpan={9} className="py-8 text-center text-destructive">
                  {error}
                </TableCell>
              </TableRow>
            ) : payments.length > 0 ? (
              payments.map((payment) => <PaymentRow key={payment.id} payment={payment} />)
            ) : (
              <TableRow>
                <TableCell colSpan={9} className="py-8 text-center text-muted-foreground">
                  No payments found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {meta && meta.last_page > 1 && (
        <PaginationControls
          meta={meta}
          loading={loading}
          onPageChange={(page) => applyFilter({ page: String(page) }, { resetPage: false })}
        />
      )}
    </div>
  );
}

function PaymentRow({ payment }: { payment: AdminPayment }) {
  const workJob = payment.work_job;
  const recordedAt = payment.paid_at ?? payment.created_at;

  return (
    <TableRow>
      <TableCell>
        <div className="space-y-1">
          <p className="font-medium">{payment.payment_number ?? `PAY-${payment.id}`}</p>
          {payment.provider_capture_id && (
            <p className="max-w-[190px] truncate text-xs text-muted-foreground">
              Capture {payment.provider_capture_id}
            </p>
          )}
        </div>
      </TableCell>
      <TableCell>
        {workJob ? (
          <div className="space-y-1">
            <Link href={`/dashboard/work-jobs/${workJob.id}`} className="font-medium text-primary hover:underline">
              {workJob.work_job_number}
            </Link>
            <p className="text-xs text-muted-foreground">
              {formatPaymentSchedule(workJob.scheduled_date, workJob.scheduled_time_from, workJob.scheduled_time_until)}
            </p>
          </div>
        ) : (
          <span className="text-muted-foreground">-</span>
        )}
      </TableCell>
      <TableCell>
        <div className="space-y-1">
          <p className="font-medium">{workJob?.full_name ?? payment.provider_payer_email ?? "-"}</p>
          <p className="text-xs text-muted-foreground">{workJob?.phone_number ?? workJob?.email ?? payment.provider_payer_email ?? "-"}</p>
        </div>
      </TableCell>
      <TableCell>
        <PaymentBadge className={paymentTypeStyle[payment.type]}>{payment.type_label}</PaymentBadge>
      </TableCell>
      <TableCell>
        <PaymentBadge className={paymentMethodStyle[payment.method]}>{payment.method_label}</PaymentBadge>
      </TableCell>
      <TableCell>
        <PaymentBadge className={paymentStatusStyle[payment.status]}>{payment.status_label}</PaymentBadge>
      </TableCell>
      <TableCell className="text-right font-medium">{formatPeso(payment.amount)}</TableCell>
      <TableCell>
        <div className="space-y-1">
          <p>{formatPaymentDate(recordedAt)}</p>
          {payment.creator?.full_name && (
            <p className="text-xs text-muted-foreground">By {payment.creator.full_name}</p>
          )}
        </div>
      </TableCell>
      <TableCell className="text-right">
        {workJob && (
          <Button asChild variant="ghost" size="icon-sm" aria-label={`View ${workJob.work_job_number}`}>
            <Link href={`/dashboard/work-jobs/${workJob.id}`}>
              <Eye className="size-4" />
            </Link>
          </Button>
        )}
      </TableCell>
    </TableRow>
  );
}

function PaymentBadge({ className, children }: { className?: string; children: ReactNode }) {
  return (
    <Badge variant="outline" className={cn("whitespace-nowrap", className)}>
      {children}
    </Badge>
  );
}

function StatCard({ label, value, icon: Icon }: { label: string; value: number | string; icon: ComponentType<{ className?: string }> }) {
  return (
    <div className="flex items-center gap-3 rounded-lg border bg-card px-4 py-3">
      <div className="flex size-9 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
        <Icon className="size-4" />
      </div>
      <div className="min-w-0">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="truncate text-lg font-semibold leading-tight">{value}</p>
      </div>
    </div>
  );
}

function FilterSelect({ label, value, options, onChange }: { label: string; value: string; options: AdminPaymentOption[]; onChange: (value: string) => void }) {
  return (
    <div className="space-y-1">
      <label className="text-xs font-medium text-muted-foreground">{label}</label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger className="h-9 w-full">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {options.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

function FilterDate({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return (
    <div className="space-y-1">
      <label className="text-xs font-medium text-muted-foreground">{label}</label>
      <Input type="date" className="h-9" value={value} onChange={(event) => onChange(event.target.value)} />
    </div>
  );
}

function optionList(apiOptions: AdminPaymentOption[] | undefined, fallback: AdminPaymentOption[]) {
  if (!apiOptions || apiOptions.length === 0) return fallback;

  return [{ value: "all", label: "All" }, ...apiOptions];
}
