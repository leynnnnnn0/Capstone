export type DatabaseBackup = {
  id: string;
  filename: string;
  size: number;
  driver: string;
  reason: "manual" | "pre_restore" | string;
  created_at: string;
};
