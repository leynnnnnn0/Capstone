"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { RotateCcw, ShieldCheck, SlidersHorizontal } from "lucide-react";

import { AdminTableSearch } from "@/components/ui/admin-table-search";
import { AdminMobileRecord, AdminMobileRecordDetail } from "@/components/ui/admin-mobile-record";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { PaginationControls, type PaginationMeta } from "@/components/ui/pagination-controls";
import { TableSkeletonRows } from "@/components/ui/page-skeletons";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
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

  return (
    <div className="space-y-5">
      <div className="rounded-[1.5rem] border border-white/10 bg-[#162d4a] p-5 text-white shadow-[0_18px_55px_rgba(22,45,74,0.12)] sm:p-6">
        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#b9cfe0]">Security &amp; governance</p>
        <h1 className="mt-2 text-2xl font-semibold tracking-[-0.035em] text-white">Audit Log</h1>
        <p className="mt-1 text-sm text-white/55">Track important database changes and the user who made them.</p>
      </div>

      <div className="rounded-[1.25rem] border border-[#dce4ea] bg-white p-3 shadow-[0_12px_38px_rgba(22,45,74,0.04)]">
        <div className="flex min-w-0 items-center gap-2">
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
              variant={filtersOpen ? "secondary" : "outline"}
              size="sm"
              onClick={() => setFiltersOpen((value) => !value)}
              className="size-11 shrink-0 gap-1.5 rounded-xl p-0 sm:h-11 sm:w-auto sm:px-4"
              aria-label="Toggle filters"
            >
              <SlidersHorizontal className="size-3.5" />
              <span className="hidden sm:inline">Filters</span>
            </Button>
            {hasFilters && (
              <Button type="button" variant="ghost" size="sm" onClick={resetFilters} className="size-11 shrink-0 gap-1.5 rounded-xl p-0 sm:h-11 sm:w-auto sm:px-4" aria-label="Reset filters">
                <RotateCcw className="size-3.5" />
                <span className="hidden sm:inline">Reset</span>
              </Button>
            )}
          </div>
        </div>

        {filtersOpen && (
          <div className="mt-3 grid gap-3 border-t border-[#e4ebf0] pt-3 sm:grid-cols-2 lg:grid-cols-4">
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
      </div>

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

          <div className="hidden overflow-hidden rounded-lg border md:block">
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
                  <TableCell colSpan={7} className="text-sm text-muted-foreground">No audit records yet.</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
          </div>

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
