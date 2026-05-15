export type AuditRecord = {
  id: number;
  event: string;
  auditable_type: string;
  auditable_id: number;
  user: { id: number; name: string; email: string | null } | null;
  old_values: Record<string, unknown>;
  new_values: Record<string, unknown>;
  ip_address: string | null;
  url: string | null;
  user_agent?: string | null;
  created_at: string;
};

export type AuditCollection = {
  data: AuditRecord[];
  meta: {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
  };
};
