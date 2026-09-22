import { API_BASE, ApiError, api } from "@/lib/api";

import type { DatabaseBackup } from "./types";

export function fetchDatabaseBackups() {
  return api<{ data: DatabaseBackup[] }>("/api/v1/database/backups");
}

export function createDatabaseBackup() {
  return api<{ message: string; data: DatabaseBackup }>("/api/v1/database/backups", {
    method: "POST",
  });
}

export function restoreDatabaseBackup(id: string) {
  return api<{ message: string; safety_backup: DatabaseBackup }>(
    `/api/v1/database/backups/${encodeURIComponent(id)}/restore`,
    {
      method: "POST",
      body: JSON.stringify({ confirmation: "RESTORE" }),
    },
  );
}

export async function downloadDatabaseBackup(id: string) {
  const response = await fetch(
    `${API_BASE}/api/v1/database/backups/${encodeURIComponent(id)}/download`,
    {
      credentials: "include",
      headers: { Accept: "application/octet-stream" },
    },
  );

  if (response.status === 401) {
    window.location.href = "/login";
    throw new ApiError("Unauthenticated", 401);
  }

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new ApiError(error.message ?? "Unable to download the backup.", response.status, error.errors);
  }

  const blob = await response.blob();
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = id;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}
