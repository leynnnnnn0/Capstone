"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ShieldCheck } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PaginationControls, type PaginationMeta } from "@/components/ui/pagination-controls";
import { TableSkeletonRows } from "@/components/ui/page-skeletons";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { fetchAudits } from "@/features/audits/audit-api";
import type { AuditRecord } from "@/features/audits/types";

export default function AdminAuditsPage() {
  const [audits, setAudits] = useState<AuditRecord[]>([]);
  const [meta, setMeta] = useState<PaginationMeta | null>(null);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void Promise.resolve().then(() => {
      setLoading(true);
      fetchAudits({ page, per_page: 25 })
        .then((response) => {
          setAudits(response.data);
          setMeta(response.meta);
        })
        .finally(() => setLoading(false));
    });
  }, [page]);

  return (
    <div className="space-y-5">
      <div>
        <p className="text-xs font-semibold uppercase tracking-widest text-primary">Security</p>
        <h1 className="mt-2 text-xl font-semibold tracking-tight">Audit Log</h1>
        <p className="mt-1 text-sm text-muted-foreground">Track important database changes and the user who made them.</p>
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

function AuditCard({ audit }: { audit: AuditRecord }) {
  return (
    <article className="rounded-lg border bg-card p-3 shadow-xs">
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
        <div className="rounded-md bg-muted/40 px-2 py-1.5">
          <p className="text-muted-foreground">Changes</p>
          <p className="truncate font-medium">{Object.keys(audit.new_values ?? {}).join(", ") || "No changed values"}</p>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div className="rounded-md bg-muted/40 px-2 py-1.5">
            <p className="text-muted-foreground">IP</p>
            <p className="truncate font-medium">{audit.ip_address ?? "-"}</p>
          </div>
          <div className="rounded-md bg-muted/40 px-2 py-1.5">
            <p className="text-muted-foreground">Date</p>
            <p className="truncate font-medium">{formatDate(audit.created_at)}</p>
          </div>
        </div>
      </div>
    </article>
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
