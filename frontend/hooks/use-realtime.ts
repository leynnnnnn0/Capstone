"use client";

import { useEffect } from "react";

import { hasRole } from "@/features/auth/current-user-api";
import { getEcho } from "@/lib/realtime/echo";
import type { User } from "@/types/user";
import type {
  NotificationCreatedPayload,
  RecordsChangedPayload,
} from "@/features/notifications/types";

export const REALTIME_RECORDS_CHANGED = "sog:records-changed";
export const REALTIME_NOTIFICATION_CREATED = "sog:notification-created";

export function useRealtimeSubscriptions(user: User | null | undefined) {
  const userId = user?.id;
  const isStaff = ["admin", "owner", "staff"].some((role) => hasRole(user, role));

  useEffect(() => {
    if (!userId) return;

    function reconcile() {
      if (document.visibilityState !== "visible") return;

      window.dispatchEvent(new CustomEvent<RecordsChangedPayload>(REALTIME_RECORDS_CHANGED, {
        detail: { type: "refresh", action: "reconcile", occurred_at: new Date().toISOString() },
      }));
    }

    // Reconcile visible views even if the socket disconnects or a broadcast is missed.
    const interval = window.setInterval(reconcile, 15_000);
    document.addEventListener("visibilitychange", reconcile);
    window.addEventListener("online", reconcile);
    return () => {
      window.clearInterval(interval);
      document.removeEventListener("visibilitychange", reconcile);
      window.removeEventListener("online", reconcile);
    };
  }, [userId]);

  useEffect(() => {
    if (!userId) return;

    const echo = getEcho();
    if (!echo) return;

    const userChannel = echo.private(`users.${userId}`);

    userChannel.listen(
      ".notification.created",
      (payload: NotificationCreatedPayload) => {
        window.dispatchEvent(
          new CustomEvent(REALTIME_NOTIFICATION_CREATED, { detail: payload }),
        );
      },
    );

    // Staff receive record changes on the shared channel and personal notifications on their own.
    const recordsChannel = isStaff ? echo.private("staff") : userChannel;
    recordsChannel.listen(".records.changed", (payload: RecordsChangedPayload) => {
      window.dispatchEvent(
        new CustomEvent(REALTIME_RECORDS_CHANGED, { detail: payload }),
      );
    });

    return () => {
      echo.leave(`users.${userId}`);
      if (isStaff) echo.leave("staff");
    };
  }, [userId, isStaff]);
}

export function useRealtimeRefresh(
  callback: (payload: RecordsChangedPayload) => void,
  types?: string[],
) {
  useEffect(() => {
    function onChanged(event: Event) {
      const payload = (event as CustomEvent<RecordsChangedPayload>).detail;

      if (types ? payload.type === "refresh" || types.includes(payload.type) : payload.type !== "refresh") {
        callback(payload);
      }
    }

    window.addEventListener(REALTIME_RECORDS_CHANGED, onChanged);
    return () => window.removeEventListener(REALTIME_RECORDS_CHANGED, onChanged);
  }, [callback, types]);
}
