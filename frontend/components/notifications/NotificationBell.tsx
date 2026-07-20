"use client";

import { useState } from "react";
import Link from "next/link";
import { Bell, CheckCheck, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { useNotifications } from "@/hooks/use-notifications";
import { toast } from "sonner";

export function NotificationBell({ className }: { className?: string }) {
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const [deleteAllOpen, setDeleteAllOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deletingAll, setDeletingAll] = useState(false);
  const {
    notifications,
    unreadCount,
    loading,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    deleteAllNotifications,
  } = useNotifications();

  async function confirmDeleteNotification() {
    if (!deleteTargetId) return;

    setDeleting(true);
    try {
      await deleteNotification(deleteTargetId);
      setDeleteTargetId(null);
      toast.success("Notification deleted.");
    } catch {
      toast.error("Unable to delete notification.");
    } finally {
      setDeleting(false);
    }
  }

  async function confirmDeleteAllNotifications() {
    setDeletingAll(true);
    try {
      await deleteAllNotifications();
      setDeleteAllOpen(false);
      toast.success("All notifications deleted.");
    } catch {
      toast.error("Unable to delete all notifications.");
    } finally {
      setDeletingAll(false);
    }
  }

  return (
    <>
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
            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    void markAllAsRead();
                    toast.success("Notifications marked as read.");
                  }}
                  className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
                >
                  <CheckCheck className="size-3" />
                  Mark all read
                </button>
              )}
              {!loading && notifications.length > 0 && (
                <button
                  type="button"
                  onClick={() => setDeleteAllOpen(true)}
                  className="inline-flex items-center gap-1 text-xs font-medium text-destructive hover:underline"
                >
                  <Trash2 className="size-3" />
                  Delete all
                </button>
              )}
            </div>
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
                      setDeleteTargetId(notification.id);
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
      <AlertDialog open={Boolean(deleteTargetId)} onOpenChange={(open) => !open && setDeleteTargetId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete notification?</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove the notification from your notification list.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction disabled={deleting} onClick={confirmDeleteNotification}>
              {deleting ? "Deleting..." : "Delete Notification"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <AlertDialog open={deleteAllOpen} onOpenChange={(open) => !deletingAll && setDeleteAllOpen(open)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete all notifications?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove every notification from your notification list.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deletingAll}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              disabled={deletingAll}
              className="bg-destructive text-white hover:bg-destructive/90"
              onClick={confirmDeleteAllNotifications}
            >
              {deletingAll ? "Deleting..." : "Delete All Notifications"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
