import { customerStatusMeta } from "@/features/customer/customer-utils";
import type { CustomerStatus } from "@/features/customer/types";
import { cn } from "@/lib/utils";

export default function CustomerStatusBadge({ status }: { status: CustomerStatus }) {
  const meta = customerStatusMeta[status] ?? customerStatusMeta.pending;

  return (
    <span className={cn("inline-flex rounded-full border px-2.5 py-1 text-xs font-bold", meta.className)}>
      {meta.label}
    </span>
  );
}
