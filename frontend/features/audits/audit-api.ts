import { api } from "@/lib/api";

import type { AuditCollection, AuditRecord } from "./types";

export function fetchAudits(params: Record<string, string | number> = {}) {
  const query = new URLSearchParams(
    Object.entries(params).map(([key, value]) => [key, String(value)]),
  );

  return api<AuditCollection>(`/api/v1/audits${query.size ? `?${query}` : ""}`);
}

export function fetchAudit(id: string | number) {
  return api<{ data: AuditRecord }>(`/api/v1/audits/${id}`);
}
