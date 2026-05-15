"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ShieldCheck } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { fetchAudits } from "@/features/audits/audit-api";
import type { AuditRecord } from "@/features/audits/types";

export default function AdminAuditsPage() {
  const [audits, setAudits] = useState<AuditRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAudits({ per_page: 50 })
      .then((response) => setAudits(response.data))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-5">
      <div>
        <p className="text-xs font-semibold uppercase tracking-widest text-primary">Security</p>
        <h1 className="mt-2 text-xl font-semibold tracking-tight">Audit Log</h1>
        <p className="mt-1 text-sm text-muted-foreground">Track important database changes and the user who made them.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <ShieldCheck className="size-4 text-primary" />
            Latest activity
          </CardTitle>
        </CardHeader>
        <CardContent>
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
                <TableRow>
                  <TableCell colSpan={7} className="text-sm text-muted-foreground">Loading audits...</TableCell>
                </TableRow>
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
        </CardContent>
      </Card>
    </div>
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
