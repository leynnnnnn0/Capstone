import CustomerRecordProgress from "@/components/customer/shared/CustomerRecordProgress";
import { CustomerStatus } from "@/features/customer/status";
import type { CustomerWorkJob } from "@/features/customer/types";

const stages = [
  { status: CustomerStatus.Confirmed, label: "Confirmed" },
  { status: CustomerStatus.OnTheWay, label: "On the way" },
  { status: CustomerStatus.InProgress, label: "In progress" },
  { status: CustomerStatus.Completed, label: "Completed" },
];

export default function WorkJobProgress({
  workJob,
  remarks,
  showStatusLabel,
}: {
  workJob: CustomerWorkJob;
  remarks: CustomerWorkJob["remarks"];
  showStatusLabel?: boolean;
}) {
  return (
    <CustomerRecordProgress
      title="Work job progress"
      status={workJob.status}
      statusLabel={workJob.status_label}
      showStatusLabel={showStatusLabel}
      remarks={remarks}
      stages={stages.map((stage) => ({
        ...stage,
        // Work jobs created through the service start confirmed without a status remark.
        fallbackTimestamp: stage.status === CustomerStatus.Confirmed ? workJob.created_at : undefined,
      }))}
    />
  );
}
