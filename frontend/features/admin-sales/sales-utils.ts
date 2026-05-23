export function formatPeso(value: number | string | null | undefined) {
  const amount = Number(value ?? 0);

  return new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
    maximumFractionDigits: 2,
  }).format(Number.isFinite(amount) ? amount : 0);
}

export function formatPercent(value: number | string | null | undefined) {
  const amount = Number(value ?? 0);

  return `${Number.isFinite(amount) ? amount.toFixed(1) : "0.0"}%`;
}

export function formatReportDate(value?: string | null) {
  if (!value) return "-";

  return new Date(value).toLocaleString("en-PH", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function compactPeso(value: number | string | null | undefined) {
  const amount = Number(value ?? 0);

  return new Intl.NumberFormat("en-PH", {
    notation: "compact",
    compactDisplay: "short",
    maximumFractionDigits: 1,
  }).format(Number.isFinite(amount) ? amount : 0);
}
