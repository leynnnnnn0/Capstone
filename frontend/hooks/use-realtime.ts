"use client";

import { useEffect } from "react";

import { getEcho } from "@/lib/realtime/echo";
import type { User } from "@/types/user";
import type {
  NotificationCreatedPayload,
  RecordsChangedPayload,
} from "@/features/notifications/types";

export const REALTIME_RECORDS_CHANGED = "sog:records-changed";
export const REALTIME_NOTIFICATION_CREATED = "sog:notification-created";

export function useRealtimeSubscriptions(user: User | null | undefined) {
  useEffect(() => {
    if (!user?.id) return;

    const echo = getEcho();
    if (!echo) return;

    const userChannel = echo.private(`users.${user.id}`);

    userChannel.listen(
      ".notification.created",
      (payload: NotificationCreatedPayload) => {
        window.dispatchEvent(
          new CustomEvent(REALTIME_NOTIFICATION_CREATED, { detail: payload }),
        );
      },
    );

    userChannel.listen(".records.changed", (payload: RecordsChangedPayload) => {
      window.dispatchEvent(
        new CustomEvent(REALTIME_RECORDS_CHANGED, { detail: payload }),
      );
    });

    const isStaff = user.roles?.some((role) =>
      ["admin", "sub_admin", "worker"].includes(role),
    );

    const staffChannel = isStaff ? echo.private("staff") : null;

    staffChannel?.listen(".records.changed", (payload: RecordsChangedPayload) => {
      window.dispatchEvent(
        new CustomEvent(REALTIME_RECORDS_CHANGED, { detail: payload }),
      );
    });

    return () => {
      echo.leave(`users.${user.id}`);
      if (isStaff) echo.leave("staff");
    };
  }, [user?.id, user?.roles]);
}

export function useRealtimeRefresh(
  callback: (payload: RecordsChangedPayload) => void,
  types?: string[],
) {
  useEffect(() => {
    function onChanged(event: Event) {
      const payload = (event as CustomEvent<RecordsChangedPayload>).detail;

      if (!types || types.includes(payload.type)) {
        callback(payload);
      }
    }

    window.addEventListener(REALTIME_RECORDS_CHANGED, onChanged);
    return () => window.removeEventListener(REALTIME_RECORDS_CHANGED, onChanged);
  }, [callback, types]);
}
