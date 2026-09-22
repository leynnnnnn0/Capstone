import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  workJobStatusLabel,
  workJobStatusStyle,
} from "@/features/admin-work-jobs/admin-work-job-utils";
import type { AdminWorkJobStatus } from "@/features/admin-work-jobs/types";

export default function AdminWorkJobStatusBadge({ status }: { status: string }) {
  const knownStatus = status as AdminWorkJobStatus;

  return (
    <Badge variant="outline" className={cn("capitalize", workJobStatusStyle[knownStatus] ?? "border-transparent bg-slate-600 text-white")}>
      <span aria-hidden="true" className="size-1.5 rounded-full bg-current opacity-80" />
      {workJobStatusLabel(status)}
    </Badge>
  );
}
