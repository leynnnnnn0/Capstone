import type { CustomerPaymentMethod, CustomerPaymentStatus, CustomerPaymentType } from "@/features/customer/types";

export const defaultPaymentStatusOptions = [
  { value: "all", label: "All statuses" },
  { value: "pending", label: "Pending" },
  { value: "paid", label: "Paid" },
  { value: "failed", label: "Failed" },
  { value: "cancelled", label: "Cancelled" },
  { value: "partially_refunded", label: "Partially Refunded" },
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
  pending: "border-transparent bg-amber-500 text-white",
  paid: "border-transparent bg-emerald-600 text-white",
  failed: "border-transparent bg-red-600 text-white",
  cancelled: "border-transparent bg-slate-600 text-white",
  partially_refunded: "border-transparent bg-sky-600 text-white",
  refunded: "border-transparent bg-blue-600 text-white",
};

export const paymentMethodStyle: Record<CustomerPaymentMethod, string> = {
  paypal: "border-transparent bg-blue-600 text-white",
  cash: "border-transparent bg-emerald-600 text-white",
  bank_transfer: "border-transparent bg-violet-600 text-white",
  other: "border-transparent bg-slate-600 text-white",
};

export const paymentTypeStyle: Record<CustomerPaymentType, string> = {
  down_payment: "border-transparent bg-amber-500 text-white",
  final_payment: "border-transparent bg-sky-600 text-white",
  full_payment: "border-transparent bg-emerald-600 text-white",
  additional_charge: "border-transparent bg-violet-600 text-white",
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
