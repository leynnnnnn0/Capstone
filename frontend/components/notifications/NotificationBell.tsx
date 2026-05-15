"use client";

import Link from "next/link";
import { Bell, CheckCheck, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { useNotifications } from "@/hooks/use-notifications";

export function NotificationBell({ className }: { className?: string }) {
  const {
    notifications,
    unreadCount,
    loading,
    markAsRead,
    markAllAsRead,
    deleteNotification,
  } = useNotifications();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className={cn("relative size-8 rounded-full", className)}
          aria-label="Notifications"
        >
          <Bell className="size-4" />
          {unreadCount > 0 && (
            <span className="absolute -right-0.5 -top-0.5 flex min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[9px] font-medium leading-4 text-white">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80 p-0">
        <div className="flex items-center justify-between px-3 py-2">
          <DropdownMenuLabel className="p-0 text-sm font-medium">
            Notifications
          </DropdownMenuLabel>
          {unreadCount > 0 && (
            <button
              type="button"
              onClick={markAllAsRead}
              className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
            >
              <CheckCheck className="size-3" />
              Mark all read
            </button>
          )}
        </div>
        <DropdownMenuSeparator />
        <div className="max-h-96 overflow-y-auto py-1">
          {loading ? (
            <p className="px-3 py-4 text-sm text-muted-foreground">
              Loading notifications...
            </p>
          ) : notifications.length > 0 ? (
            notifications.map((notification) => (
              <div
                key={notification.id}
                className={cn(
                  "group flex items-start gap-2 px-3 py-2 hover:bg-accent",
                  !notification.read_at && "bg-primary/5",
                )}
              >
                <Link
                  href={notification.href ?? "#"}
                  onClick={() => {
                    if (!notification.read_at) void markAsRead(notification.id);
                  }}
                  className={cn(
                    "flex min-w-0 flex-1 flex-col gap-1 whitespace-normal",
                  )}
                >
                  <span className="text-sm font-medium text-foreground">
                    {notification.title}
                  </span>
                  <span className="text-xs leading-5 text-muted-foreground">
                    {notification.message}
                  </span>
                  {notification.record_number && (
                    <span className="text-[11px] font-medium uppercase tracking-wide text-primary">
                      {notification.record_number}
                    </span>
                  )}
                </Link>
                <button
                  type="button"
                  className="mt-0.5 rounded-md p-1 text-muted-foreground opacity-70 hover:bg-background hover:text-destructive group-hover:opacity-100"
                  aria-label="Delete notification"
                  onClick={(event) => {
                    event.preventDefault();
                    event.stopPropagation();
                    void deleteNotification(notification.id);
                  }}
                >
                  <Trash2 className="size-3.5" />
                </button>
              </div>
            ))
          ) : (
            <p className="px-3 py-4 text-sm text-muted-foreground">
              No notifications yet.
            </p>
          )}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
