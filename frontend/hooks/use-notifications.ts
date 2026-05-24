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

const NOTIFICATION_FALLBACK_POLL_MS = 45_000;

export function useNotifications() {
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    async function loadNotifications(silent = false) {
      if (!silent) setLoading(true);

      try {
        const response = await fetchNotifications();
        if (!active) return;
        setNotifications(response.data);
        setUnreadCount(response.unread_count);
      } catch {
        if (!active) return;
        if (!silent) {
          setNotifications([]);
          setUnreadCount(0);
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    void loadNotifications();

    const fallbackPoll = window.setInterval(() => {
      void loadNotifications(true);
    }, NOTIFICATION_FALLBACK_POLL_MS);

    return () => {
      active = false;
      window.clearInterval(fallbackPoll);
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
