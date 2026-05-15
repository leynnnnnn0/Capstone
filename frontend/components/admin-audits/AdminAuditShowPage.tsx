"use client";

import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import Link from "next/link";
import { ArrowLeft, ShieldCheck } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { fetchAudit } from "@/features/audits/audit-api";
import type { AuditRecord } from "@/features/audits/types";

export default function AdminAuditShowPage({ auditId }: { auditId: string }) {
  const [audit, setAudit] = useState<AuditRecord | null>(null);

  useEffect(() => {
    fetchAudit(auditId).then((response) => setAudit(response.data));
  }, [auditId]);

  if (!audit) {
    return <div className="rounded-lg border bg-card p-6 text-sm text-muted-foreground">Loading audit...</div>;
  }

  return (
    <div className="space-y-5">
      <div>
        <Button asChild variant="ghost" size="sm" className="-ml-2 gap-1.5">
          <Link href="/dashboard/audits">
            <ArrowLeft className="size-4" />
            Back to audit log
          </Link>
        </Button>
        <p className="mt-3 text-xs font-semibold uppercase tracking-widest text-primary">Audit #{audit.id}</p>
        <h1 className="mt-2 text-xl font-semibold tracking-tight">{audit.auditable_type} #{audit.auditable_id}</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <ShieldCheck className="size-4 text-primary" />
            Change details
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm">
          <div className="grid gap-3 md:grid-cols-3">
            <Info label="Event" value={<Badge variant="outline">{audit.event}</Badge>} />
            <Info label="User" value={audit.user?.name ?? "System"} />
            <Info label="Date" value={formatDate(audit.created_at)} />
            <Info label="IP Address" value={audit.ip_address ?? "-"} />
            <Info label="URL" value={audit.url ?? "-"} wide />
          </div>

          <Separator />

          <div className="grid gap-4 lg:grid-cols-2">
            <ValuePanel title="Before" values={audit.old_values ?? {}} />
            <ValuePanel title="After" values={audit.new_values ?? {}} />
          </div>

          {audit.user_agent && (
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">User Agent</p>
              <p className="mt-1 break-words rounded-lg bg-muted p-3 text-xs text-muted-foreground">{audit.user_agent}</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function Info({ label, value, wide }: { label: string; value: ReactNode; wide?: boolean }) {
  return (
    <div className={wide ? "md:col-span-2" : ""}>
      <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">{label}</p>
      <div className="mt-1">{value}</div>
    </div>
  );
}

function ValuePanel({ title, values }: { title: string; values: Record<string, unknown> }) {
  const entries = Object.entries(values);

  return (
    <div className="rounded-lg border">
      <div className="border-b px-4 py-2 text-xs font-semibold uppercase tracking-widest text-primary">{title}</div>
      <div className="divide-y">
        {entries.length ? entries.map(([key, value]) => (
          <div key={key} className="grid grid-cols-[140px_1fr] gap-3 px-4 py-2 text-xs">
            <span className="font-medium text-muted-foreground">{key}</span>
            <span className="break-words">{formatValue(value)}</span>
          </div>
        )) : (
          <p className="px-4 py-4 text-xs text-muted-foreground">No values recorded.</p>
        )}
      </div>
    </div>
  );
}

function formatValue(value: unknown) {
  if (value === null || value === undefined || value === "") return "-";
  if (typeof value === "object") return JSON.stringify(value, null, 2);
  return String(value);
}

function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return date.toLocaleString("en-PH", {
    month: "long",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}
