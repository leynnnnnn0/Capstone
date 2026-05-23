import { API_BASE, api } from "@/lib/api";
import type { SalesFilters, SalesReport } from "./types";

export type SalesExportFormat = "csv" | "xlsx" | "pdf";

function queryString(filters: SalesFilters = {}) {
  const params = new URLSearchParams();

  Object.entries(filters).forEach(([key, value]) => {
    if (value) params.set(key, String(value));
  });

  return params.toString();
}

export function fetchSalesReport(filters: SalesFilters = {}) {
  const query = queryString(filters);

  return api<SalesReport>(`/api/v1/sales${query ? `?${query}` : ""}`);
}

export async function downloadSalesReport(filters: SalesFilters = {}, format: SalesExportFormat) {
  const query = queryString(filters);
  const response = await fetch(`${API_BASE}/api/v1/sales/export/${format}${query ? `?${query}` : ""}`, {
    credentials: "include",
    headers: {
      Accept: acceptHeader(format),
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message ?? `Unable to export sales report (${response.status}).`);
  }

  const blob = await response.blob();
  const filename = filenameFromDisposition(response.headers.get("Content-Disposition")) ?? fallbackFilename(format);
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function acceptHeader(format: SalesExportFormat) {
  if (format === "pdf") return "application/pdf";
  if (format === "xlsx") return "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";

  return "text/csv";
}

function fallbackFilename(format: SalesExportFormat) {
  return `sog-sales-report.${format}`;
}

function filenameFromDisposition(disposition: string | null) {
  if (!disposition) return null;

  const utfMatch = disposition.match(/filename\*=UTF-8''([^;]+)/i);
  if (utfMatch?.[1]) return decodeURIComponent(utfMatch[1]);

  const asciiMatch = disposition.match(/filename="?([^"]+)"?/i);
  return asciiMatch?.[1] ?? null;
}
