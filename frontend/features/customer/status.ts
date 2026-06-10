export enum CustomerStatus {
  Pending = "pending",
  Confirmed = "confirmed",
  Rescheduled = "rescheduled",
  OnTheWay = "on_the_way",
  InProgress = "in_progress",
  Completed = "completed",
  Cancelled = "cancelled",
  Reopened = "reopened",
  NoShow = "no_show",
}

export const customerStatusValues = [
  CustomerStatus.Pending,
  CustomerStatus.Confirmed,
  CustomerStatus.Rescheduled,
  CustomerStatus.OnTheWay,
  CustomerStatus.InProgress,
  CustomerStatus.Completed,
  CustomerStatus.Cancelled,
  CustomerStatus.Reopened,
  CustomerStatus.NoShow,
] as const;

export const customerTerminalStatuses: readonly CustomerStatus[] = [
  CustomerStatus.Cancelled,
  CustomerStatus.Completed,
  CustomerStatus.NoShow,
] as const;

export const activeWorkJobBlockedStatuses: readonly CustomerStatus[] = [
  CustomerStatus.Cancelled,
  CustomerStatus.Completed,
] as const;

export const customerStatusOptions = customerStatusValues.map((value) => ({
  value,
  label: statusLabel(value),
}));

export function statusLabel(status: CustomerStatus | string) {
  if (status === CustomerStatus.OnTheWay) return "On the Way";
  if (status === CustomerStatus.InProgress) return "In Progress";
  if (status === CustomerStatus.NoShow) return "No Show";

  return status
    .replace(/[_-]+/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export function statusIn(status: CustomerStatus | string | null | undefined, statuses: readonly CustomerStatus[]) {
  return Boolean(status && (statuses as readonly string[]).includes(status));
}
