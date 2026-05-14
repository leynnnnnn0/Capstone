import type { TrackingType } from "./types";

export const statusConfig: Record<string, { label: string; color: string; bg: string; dot: string }> = {
  pending: { label: "Pending", color: "#92400e", bg: "#fffbeb", dot: "#f59e0b" },
  confirmed: { label: "Confirmed", color: "#065f46", bg: "#ecfdf5", dot: "#10b981" },
  completed: { label: "Completed", color: "#1e3a5f", bg: "#eef2f8", dot: "#2c5282" },
  cancelled: { label: "Cancelled", color: "#7f1d1d", bg: "#fef2f2", dot: "#ef4444" },
  on_the_way: { label: "On The Way", color: "#1d4ed8", bg: "#dbeafe", dot: "#3b82f6" },
  in_progress: { label: "In Progress", color: "#1e40af", bg: "#eff6ff", dot: "#3b82f6" },
  inspected: { label: "Inspected", color: "#065f46", bg: "#ecfdf5", dot: "#10b981" },
  quoted: { label: "Quoted", color: "#3730a3", bg: "#eef2ff", dot: "#6366f1" },
  for_acceptance: { label: "For Acceptance", color: "#92400e", bg: "#fffbeb", dot: "#f59e0b" },
  paid: { label: "Paid", color: "#065f46", bg: "#ecfdf5", dot: "#10b981" },
};

export const appointmentPipeline = ["pending", "confirmed", "inspected", "quoted", "for_acceptance", "paid", "completed"];
export const workJobPipeline = ["pending", "confirmed", "in_progress", "completed"];

export function getStatus(status: string) {
  const key = status?.toLowerCase();

  return statusConfig[key] ?? {
    label: humanizeStatus(status),
    color: "#475569",
    bg: "#f8fafc",
    dot: "#94a3b8",
  };
}

function humanizeStatus(status?: string | null) {
  if (!status) return "Unknown";

  return status
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export function trackingPipeline(type: TrackingType) {
  return type === "work_job" ? workJobPipeline : appointmentPipeline;
}

export function formatCurrency(value: number) {
  return `PHP ${Number(value).toLocaleString("en-PH", { maximumFractionDigits: 0 })}`;
}

export function formatDate(value?: string | null) {
  if (!value) return "-";

  return new Date(`${value}T00:00:00`).toLocaleDateString("en-PH", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export function formatDateTime(date?: string | null, from?: string | null, until?: string | null) {
  if (!date) return "-";
  if (from && until) return `${formatDate(date)} · ${from} - ${until}`;
  if (from) return `${formatDate(date)} · ${from}`;
  return formatDate(date);
}

export function formatTrackingTimestamp(value?: string | null) {
  if (!value) return "-";

  const normalized = value.includes("T") ? value : value.replace(" ", "T");
  const date = new Date(normalized);

  if (Number.isNaN(date.getTime())) return value;

  return date.toLocaleString("en-PH", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}
