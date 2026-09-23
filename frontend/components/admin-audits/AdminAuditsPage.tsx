"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { FileClock, LogIn, RotateCcw, ShieldCheck, SlidersHorizontal } from "lucide-react";

import AdminSummaryCard from "@/components/admin/AdminSummaryCard";
import { AdminTableSearch } from "@/components/ui/admin-table-search";
import { AdminMobileRecord, AdminMobileRecordDetail } from "@/components/ui/admin-mobile-record";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { PaginationControls, type PaginationMeta } from "@/components/ui/pagination-controls";
import { TableSkeletonRows } from "@/components/ui/page-skeletons";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableFrame, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { fetchAudits } from "@/features/audits/audit-api";
import type { AuditRecord } from "@/features/audits/types";
import { useDebouncedValue } from "@/hooks/use-debounced-value";

export default function AdminAuditsPage() {
  const [audits, setAudits] = useState<AuditRecord[]>([]);
  const [meta, setMeta] = useState<PaginationMeta | null>(null);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [event, setEvent] = useState("all");
  const [recordType, setRecordType] = useState("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const debouncedSearch = useDebouncedValue(search.trim());
  const hasFilters = Boolean(search || event !== "all" || recordType !== "all" || dateFrom || dateTo);

  useEffect(() => {
    void Promise.resolve().then(() => {
      setLoading(true);
      fetchAudits({
        page,
        per_page: 25,
        ...(debouncedSearch ? { search: debouncedSearch } : {}),
        ...(event !== "all" ? { event } : {}),
        ...(recordType !== "all" ? { auditable_type: recordType } : {}),
        ...(dateFrom ? { date_from: dateFrom } : {}),
        ...(dateTo ? { date_to: dateTo } : {}),
      })
        .then((response) => {
          setAudits(response.data);
          setMeta(response.meta);
        })
        .finally(() => setLoading(false));
    });
  }, [dateFrom, dateTo, debouncedSearch, event, page, recordType]);

  function resetFilters() {
    setSearch("");
    setEvent("all");
    setRecordType("all");
    setDateFrom("");
    setDateTo("");
    setPage(1);
  }

  const totalAudits = meta?.total ?? audits.length;
  const signInEvents = audits.filter((audit) => audit.event.includes("login")).length;
  const dataChanges = audits.filter((audit) => ["created", "updated", "deleted"].includes(audit.event)).length;

  return (
    <div className="space-y-10">
      <section className="flex flex-col gap-5 border-b pb-8 sm:gap-8 sm:pb-10 lg:flex-row lg:items-center lg:justify-between">
        <div className="max-w-3xl">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#64879a]">
            Administration · Security activity
          </p>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight text-[#2d425b] sm:mt-4 sm:text-4xl">Audit log</h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-[#71869c] sm:mt-4 sm:text-base sm:leading-7">
            Trace authentication events and important record changes across the system.
          </p>
        </div>
        <div className="hidden items-center gap-3 self-start md:flex lg:self-auto">
          <span className="flex size-10 items-center justify-center rounded-lg bg-[#eef4f7] text-[#64879a]">
            <ShieldCheck className="size-4" />
          </span>
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#8194a7]">Audit trail</p>
            <p className="mt-0.5 text-sm font-semibold text-[#2d425b]">{totalAudits} recorded event{totalAudits === 1 ? "" : "s"}</p>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-2 gap-x-4 border-b pb-8 sm:grid-cols-3 sm:gap-x-7 sm:pb-10 [&>*:first-child]:col-span-2 sm:[&>*:first-child]:col-span-1">
        <AdminSummaryCard label="Events" value={totalAudits} icon={ShieldCheck} eyebrow="Live workspace" description="all recorded activity" />
        <AdminSummaryCard label="Sign-ins on this page" value={signInEvents} icon={LogIn} eyebrow="Live workspace" description="staff and customer access" />
        <AdminSummaryCard label="Data changes on this page" value={dataChanges} icon={FileClock} eyebrow="Live workspace" description="created, updated, or deleted" />
      </section>

      <section className="space-y-4">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#64879a]">Activity</p>
            <h2 className="mt-2 text-xl font-semibold tracking-tight text-[#2d425b]">Audit records</h2>
          </div>
          <div className="flex min-w-0 items-center gap-2 lg:w-[40rem]">
          <AdminTableSearch
            value={search}
            onChange={(value) => {
              setSearch(value);
              setPage(1);
            }}
            placeholder="Search event, record, user, or IP address..."
          />
          <div className="flex shrink-0 gap-2">
            <Button
              type="button"
              variant="default"
              size="sm"
              onClick={() => setFiltersOpen((value) => !value)}
              className="size-11 shrink-0 gap-1.5 rounded-lg bg-[#2d425b] p-0 text-white hover:bg-[#23364b] sm:h-11 sm:w-auto sm:px-4"
              aria-label="Toggle filters"
            >
              <SlidersHorizontal className="size-3.5" />
              <span className="hidden sm:inline">Filter</span>
            </Button>
            {hasFilters && (
              <Button type="button" variant="ghost" size="sm" onClick={resetFilters} className="size-11 shrink-0 gap-1.5 rounded-xl p-0 sm:h-11 sm:w-auto sm:px-4" aria-label="Reset filters">
                <RotateCcw className="size-3.5" />
                <span className="hidden sm:inline">Reset</span>
              </Button>
            )}
          </div>
        </div>

        </div>
        {filtersOpen && (
          <div className="grid gap-3 rounded-lg border bg-card p-4 sm:grid-cols-2 lg:grid-cols-4">
            <AuditSelect
              label="Event"
              value={event}
              onValueChange={(value) => {
                setEvent(value);
                setPage(1);
              }}
              options={[
                ["all", "All events"],
                ["created", "Created"],
                ["updated", "Updated"],
                ["deleted", "Deleted"],
                ["staff_login", "Staff login"],
                ["staff_logout", "Staff logout"],
                ["customer_login", "Customer login"],
                ["customer_otp_requested", "Customer OTP requested"],
              ]}
            />
            <AuditSelect
              label="Record type"
              value={recordType}
              onValueChange={(value) => {
                setRecordType(value);
                setPage(1);
              }}
              options={[
                ["all", "All records"],
                ["App\\Models\\Appointment", "Appointment"],
                ["App\\Models\\WorkJob", "Work job"],
                ["App\\Models\\Payment", "Payment"],
                ["App\\Models\\Product", "Product"],
                ["App\\Models\\User", "User"],
                ["App\\Models\\Quotation", "Quotation"],
              ]}
            />
            <AuditDate label="From" value={dateFrom} onChange={(value) => { setDateFrom(value); setPage(1); }} />
            <AuditDate label="To" value={dateTo} onChange={(value) => { setDateTo(value); setPage(1); }} />
          </div>
        )}
      </section>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <ShieldCheck className="size-4 text-primary" />
            Latest activity
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-2 md:hidden">
            {loading ? (
              Array.from({ length: 5 }).map((_, index) => (
                <div key={index} className="h-32 animate-pulse rounded-lg border bg-muted/30" />
              ))
            ) : audits.length ? (
              audits.map((audit) => <AuditCard key={audit.id} audit={audit} />)
            ) : (
              <div className="rounded-lg border border-dashed bg-card p-6 text-center text-sm text-muted-foreground">
                No audit records yet.
              </div>
            )}
          </div>

          <TableFrame className="hidden shadow-none md:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Event</TableHead>
                  <TableHead>Record</TableHead>
                  <TableHead>User</TableHead>
                  <TableHead>Changes</TableHead>
                  <TableHead>IP</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableSkeletonRows columns={7} />
                ) : audits.length ? audits.map((audit) => (
                  <TableRow key={audit.id}>
                    <TableCell><Badge variant="outline">{audit.event}</Badge></TableCell>
                    <TableCell className="text-sm">{audit.auditable_type} #{audit.auditable_id}</TableCell>
                    <TableCell className="text-sm">{audit.user?.name ?? "System"}</TableCell>
                    <TableCell className="max-w-[360px] truncate text-xs text-muted-foreground">
                      {Object.keys(audit.new_values ?? {}).join(", ") || "No changed values"}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">{audit.ip_address ?? "-"}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">{formatDate(audit.created_at)}</TableCell>
                    <TableCell className="text-right">
                      <Button asChild variant="outline" size="sm">
                        <Link href={`/dashboard/audits/${audit.id}`}>View</Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                )) : (
                  <TableRow>
                    <TableCell colSpan={7} className="py-10 text-center text-sm text-muted-foreground">No audit records yet.</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableFrame>

          {meta && meta.last_page > 1 && (
            <PaginationControls meta={meta} loading={loading} onPageChange={setPage} />
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function AuditSelect({
  label,
  value,
  onValueChange,
  options,
}: {
  label: string;
  value: string;
  onValueChange: (value: string) => void;
  options: Array<[string, string]>;
}) {
  return (
    <div className="space-y-1">
      <label className="text-xs font-medium text-muted-foreground">{label}</label>
      <Select value={value} onValueChange={onValueChange}>
        <SelectTrigger className="h-10 w-full rounded-xl">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {options.map(([optionValue, optionLabel]) => (
            <SelectItem key={optionValue} value={optionValue}>{optionLabel}</SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

function AuditDate({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return (
    <div className="space-y-1">
      <label className="text-xs font-medium text-muted-foreground">{label}</label>
      <Input type="date" value={value} onChange={(event) => onChange(event.target.value)} className="h-10 rounded-xl" />
    </div>
  );
}

function AuditCard({ audit }: { audit: AuditRecord }) {
  return (
    <AdminMobileRecord>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <Badge variant="outline">{audit.event}</Badge>
          <p className="mt-2 truncate text-sm font-semibold">
            {audit.auditable_type} #{audit.auditable_id}
          </p>
          <p className="truncate text-xs text-muted-foreground">{audit.user?.name ?? "System"}</p>
        </div>
        <Button asChild variant="outline" size="sm" className="shrink-0">
          <Link href={`/dashboard/audits/${audit.id}`}>View</Link>
        </Button>
      </div>
      <div className="mt-3 grid gap-2 text-xs">
        <AdminMobileRecordDetail>
          <p className="text-muted-foreground">Changes</p>
          <p className="truncate font-medium">{Object.keys(audit.new_values ?? {}).join(", ") || "No changed values"}</p>
        </AdminMobileRecordDetail>
        <div className="grid grid-cols-2 gap-2">
          <AdminMobileRecordDetail>
            <p className="text-muted-foreground">IP</p>
            <p className="truncate font-medium">{audit.ip_address ?? "-"}</p>
          </AdminMobileRecordDetail>
          <AdminMobileRecordDetail>
            <p className="text-muted-foreground">Date</p>
            <p className="truncate font-medium">{formatDate(audit.created_at)}</p>
          </AdminMobileRecordDetail>
        </div>
      </div>
    </AdminMobileRecord>
  );
}

function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return date.toLocaleString("en-PH", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}
