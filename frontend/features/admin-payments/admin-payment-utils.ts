import type { CustomerPaymentMethod, CustomerPaymentStatus, CustomerPaymentType } from "@/features/customer/types";

export const defaultPaymentStatusOptions = [
  { value: "all", label: "All statuses" },
  { value: "pending", label: "Pending" },
  { value: "paid", label: "Paid" },
  { value: "failed", label: "Failed" },
  { value: "cancelled", label: "Cancelled" },
  { value: "refunded", label: "Refunded" },
];

export const defaultPaymentMethodOptions = [
  { value: "all", label: "All methods" },
  { value: "paypal", label: "PayPal" },
  { value: "cash", label: "Cash" },
  { value: "bank_transfer", label: "Bank Transfer" },
  { value: "other", label: "Other" },
];

export const defaultPaymentTypeOptions = [
  { value: "all", label: "All types" },
  { value: "down_payment", label: "Down Payment" },
  { value: "final_payment", label: "Final Payment" },
  { value: "full_payment", label: "Full Payment" },
  { value: "additional_charge", label: "Additional Charge" },
];

export const paymentStatusStyle: Record<CustomerPaymentStatus, string> = {
  pending: "border-amber-200 bg-amber-50 text-amber-700",
  paid: "border-emerald-200 bg-emerald-50 text-emerald-700",
  failed: "border-red-200 bg-red-50 text-red-700",
  cancelled: "border-slate-200 bg-slate-50 text-slate-600",
  refunded: "border-blue-200 bg-blue-50 text-blue-700",
};

export const paymentMethodStyle: Record<CustomerPaymentMethod, string> = {
  paypal: "border-blue-200 bg-blue-50 text-blue-700",
  cash: "border-emerald-200 bg-emerald-50 text-emerald-700",
  bank_transfer: "border-violet-200 bg-violet-50 text-violet-700",
  other: "border-slate-200 bg-slate-50 text-slate-600",
};

export const paymentTypeStyle: Record<CustomerPaymentType, string> = {
  down_payment: "border-amber-200 bg-amber-50 text-amber-700",
  final_payment: "border-sky-200 bg-sky-50 text-sky-700",
  full_payment: "border-emerald-200 bg-emerald-50 text-emerald-700",
  additional_charge: "border-violet-200 bg-violet-50 text-violet-700",
};

export function formatPeso(value: number | string | null | undefined) {
  const amount = Number(value ?? 0);

  return new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
    maximumFractionDigits: 2,
  }).format(Number.isFinite(amount) ? amount : 0);
}

export function formatPaymentDate(value?: string | null) {
  if (!value) return "-";

  return new Date(value).toLocaleString("en-PH", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function formatPaymentSchedule(
  date?: string | null,
  from?: string | null,
  until?: string | null,
) {
  if (!date) return "-";

  const formattedDate = new Date(`${date}T00:00:00`).toLocaleDateString("en-PH", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  return [formattedDate, from && until ? `${formatTime(from)} - ${formatTime(until)}` : null]
    .filter(Boolean)
    .join(" · ");
}

function formatTime(value: string) {
  const [hours, minutes] = value.split(":").map(Number);
  if (Number.isNaN(hours) || Number.isNaN(minutes)) return value;

  return `${hours % 12 || 12}:${String(minutes).padStart(2, "0")} ${hours >= 12 ? "PM" : "AM"}`;
}
