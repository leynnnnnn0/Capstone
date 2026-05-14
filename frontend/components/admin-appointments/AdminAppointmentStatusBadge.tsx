import { adminStatusMeta } from "@/features/admin-appointments/admin-appointment-utils";
import type { AdminAppointmentStatus } from "@/features/admin-appointments/types";
import { cn } from "@/lib/utils";

export default function AdminAppointmentStatusBadge({ status }: { status: AdminAppointmentStatus }) {
  const meta = adminStatusMeta[status] ?? adminStatusMeta.pending;

  return (
    <span className={cn("inline-flex rounded-full border px-2.5 py-1 text-xs font-bold", meta.className)}>
      {meta.label}
    </span>
  );
}
