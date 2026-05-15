import { api } from "@/lib/api";
import type { AppNotification, NotificationResponse } from "./types";

type SingleNotificationResponse = {
  data: AppNotification;
  unread_count: number;
};

export function fetchNotifications() {
  return api<NotificationResponse>("/api/v1/notifications");
}

export function markNotificationAsRead(id: string) {
  return api<SingleNotificationResponse>(`/api/v1/notifications/${id}/read`, {
    method: "PATCH",
  });
}

export function markAllNotificationsAsRead() {
  return api<NotificationResponse>("/api/v1/notifications/read-all", {
    method: "PATCH",
  });
}

export function deleteNotification(id: string) {
  return api<NotificationResponse>(`/api/v1/notifications/${id}`, {
    method: "DELETE",
  });
}
