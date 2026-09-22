import type { TrackingType } from "./types";

export const statusConfig: Record<string, { label: string; color: string; bg: string; dot: string }> = {
  pending: { label: "Pending", color: "#ffffff", bg: "#f59e0b", dot: "#ffffff" },
  confirmed: { label: "Confirmed", color: "#ffffff", bg: "#2563eb", dot: "#ffffff" },
  completed: { label: "Completed", color: "#ffffff", bg: "#059669", dot: "#ffffff" },
  cancelled: { label: "Cancelled", color: "#ffffff", bg: "#dc2626", dot: "#ffffff" },
  on_the_way: { label: "On The Way", color: "#ffffff", bg: "#4f46e5", dot: "#ffffff" },
  in_progress: { label: "In Progress", color: "#ffffff", bg: "#7c3aed", dot: "#ffffff" },
  inspected: { label: "Inspected", color: "#ffffff", bg: "#0891b2", dot: "#ffffff" },
  quoted: { label: "Quoted", color: "#ffffff", bg: "#7c3aed", dot: "#ffffff" },
  for_acceptance: { label: "For Acceptance", color: "#ffffff", bg: "#d97706", dot: "#ffffff" },
  paid: { label: "Paid", color: "#ffffff", bg: "#059669", dot: "#ffffff" },
};

export const appointmentPipeline = ["pending", "confirmed", "inspected", "quoted", "for_acceptance", "paid", "completed"];
export const workJobPipeline = ["pending", "confirmed", "in_progress", "completed"];

export function getStatus(status: string) {
  const key = status?.toLowerCase();

  return statusConfig[key] ?? {
    label: humanizeStatus(status),
    color: "#ffffff",
    bg: "#475569",
    dot: "#ffffff",
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
