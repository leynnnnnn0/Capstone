export type AppNotification = {
  id: string;
  type: "appointment" | "work_job" | "quotation" | string;
  action: string;
  title: string;
  message: string;
  record_id?: number;
  record_number?: string | null;
  href?: string;
  read_at: string | null;
  created_at: string;
};

export type NotificationResponse = {
  data: AppNotification[];
  unread_count: number;
};

export type RecordsChangedPayload = {
  type: "appointment" | "work_job" | "quotation" | string;
  action: string;
  id?: number;
  appointment_id?: number | null;
  parent_work_job_id?: number | null;
  number?: string | null;
  occurred_at: string;
};

export type NotificationCreatedPayload = {
  notification: AppNotification;
  unread_count: number;
};
