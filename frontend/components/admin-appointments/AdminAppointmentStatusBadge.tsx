import { adminStatusMeta } from "@/features/admin-appointments/admin-appointment-utils";
import type { AdminAppointmentStatus } from "@/features/admin-appointments/types";
import { cn } from "@/lib/utils";

export default function AdminAppointmentStatusBadge({ status }: { status: AdminAppointmentStatus }) {
  const meta = adminStatusMeta[status] ?? adminStatusMeta.pending;

  return (
    <span className={cn("inline-flex w-fit items-center gap-1.5 whitespace-nowrap rounded-full border px-3 py-1.5 text-xs font-semibold leading-none", meta.className)}>
      <span aria-hidden="true" className="size-1.5 rounded-full bg-white/85" />
      {meta.label}
    </span>
  );
}
