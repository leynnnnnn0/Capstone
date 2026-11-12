import type { CustomerAppointment, CustomerWorkJob } from "@/features/customer/types";
import type { RecordsChangedPayload } from "./types";

export function affectsAppointment(
  change: RecordsChangedPayload,
  id: number,
  workJob?: CustomerAppointment["work_job"],
) {
  switch (change.type) {
    case "refresh":
      return true;
    case "appointment":
      return change.id === id;
    case "quotation":
      return change.appointment_id === id;
    case "work_job":
      return change.appointment_id === id || (workJob != null && change.id === workJob.id);
    default:
      return false;
  }
}

export function affectsWorkJob(
  change: RecordsChangedPayload,
  id: number,
  workJob: CustomerWorkJob | null,
) {
  switch (change.type) {
    case "refresh":
      return true;
    case "work_job":
      return change.id === id || change.parent_work_job_id === id ||
        (workJob?.parent_work_job_id != null && change.id === workJob.parent_work_job_id);
    case "appointment":
      return workJob?.appointment_id != null && change.id === workJob.appointment_id;
    case "quotation":
      return (workJob?.quotation != null && change.id === workJob.quotation.id) ||
        (workJob?.appointment_id != null && change.appointment_id === workJob.appointment_id);
    default:
      return false;
  }
}
