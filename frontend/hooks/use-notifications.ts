"use client";

import { useEffect, useState } from "react";

import {
  deleteNotification,
  fetchNotifications,
  markAllNotificationsAsRead,
  markNotificationAsRead,
} from "@/features/notifications/notification-api";
import type {
  AppNotification,
  NotificationCreatedPayload,
} from "@/features/notifications/types";
import { REALTIME_NOTIFICATION_CREATED } from "@/hooks/use-realtime";

export function useNotifications() {
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    fetchNotifications()
      .then((response) => {
        if (!active) return;
        setNotifications(response.data);
        setUnreadCount(response.unread_count);
      })
      .catch(() => {
        if (!active) return;
        setNotifications([]);
        setUnreadCount(0);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    function onCreated(event: Event) {
      const payload = (event as CustomEvent<NotificationCreatedPayload>).detail;

      setNotifications((current) => [
        payload.notification,
        ...current.filter((item) => item.id !== payload.notification.id),
      ].slice(0, 20));
      setUnreadCount(payload.unread_count);
    }

    window.addEventListener(REALTIME_NOTIFICATION_CREATED, onCreated);
    return () => window.removeEventListener(REALTIME_NOTIFICATION_CREATED, onCreated);
  }, []);

  async function read(id: string) {
    const response = await markNotificationAsRead(id);
    setNotifications((current) =>
      current.map((item) =>
        item.id === response.data.id ? response.data : item,
      ),
    );
    setUnreadCount(response.unread_count);
  }

  async function readAll() {
    const response = await markAllNotificationsAsRead();
    setNotifications((current) =>
      current.map((item) => ({ ...item, read_at: item.read_at ?? new Date().toISOString() })),
    );
    setUnreadCount(response.unread_count);
  }

  async function remove(id: string) {
    const response = await deleteNotification(id);
    setNotifications((current) => current.filter((item) => item.id !== id));
    setUnreadCount(response.unread_count);
  }

  return {
    notifications,
    unreadCount,
    loading,
    markAsRead: read,
    markAllAsRead: readAll,
    deleteNotification: remove,
  };
}
