"use client";

import { Card } from "@/components/ui/card";
import AdminPageHeader from "@/components/AdminPageHeader";
import { AlertDialog } from "@/components/ui/alert-dialog";
import { useCurrentUserQuery, useDeleteNotificationMutation, useMarkNotificationReadMutation, useNotificationsQuery } from "@/lib/harvest-query";
import type { Notification, User } from "@/lib/domain";
import { AlertTriangle, Bell, CheckCircle, Clock, Mail, Package, RefreshCw, Trash2 } from "lucide-react";
import { useState } from "react";

const notificationLabels: Record<Notification["type"], string> = {
  order_created: "Order created",
  order_status: "Order status",
  rental_expiring: "Rental expiring",
  low_stock: "Low stock",
  new_order_admin: "New order",
};

const notificationStyles: Record<Notification["type"], { border: string; icon: string; surface: string }> = {
  order_created: { border: "border-blue-200", icon: "text-blue-700", surface: "bg-blue-50" },
  order_status: { border: "border-green-200", icon: "text-green-700", surface: "bg-green-50" },
  rental_expiring: { border: "border-yellow-200", icon: "text-yellow-800", surface: "bg-yellow-50" },
  low_stock: { border: "border-red-200", icon: "text-red-700", surface: "bg-red-50" },
  new_order_admin: { border: "border-purple-200", icon: "text-purple-700", surface: "bg-purple-50" },
};

export default function NotificationsModernWorkspace() {
  const currentUserQuery = useCurrentUserQuery();
  const notificationsQuery = useNotificationsQuery();
  const markNotificationReadMutation = useMarkNotificationReadMutation();
  const deleteNotificationMutation = useDeleteNotificationMutation();
  const [message, setMessage] = useState("");
  const [notificationToDelete, setNotificationToDelete] = useState<Notification | null>(null);
  const currentUser = currentUserQuery.data ?? null;
  const notifications = [...(notificationsQuery.data ?? [])].sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt));
  const isLoading = notificationsQuery.isLoading;

  const markAsRead = async (id: string) => {
    setMessage("");
    try {
      await markNotificationReadMutation.mutateAsync(id);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Notification could not be updated.");
    }
  };

  const deleteNotification = async () => {
    if (!notificationToDelete) return;
    setMessage("");
    try {
      await deleteNotificationMutation.mutateAsync(notificationToDelete.id);
      setNotificationToDelete(null);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Notification could not be deleted.");
    }
  };

  const unreadCount = notifications.filter((notification) => !notification.read).length;
  const isAdmin = currentUser?.role === "admin";
  const urgentCount = notifications.filter((notification) => !notification.read && (notification.isAdmin || notification.type === "low_stock" || notification.type === "rental_expiring" || notification.type === "new_order_admin")).length;

  return (
    <div className="harvest-theme space-y-5 text-foreground">
      <AdminPageHeader
        eyebrow={isAdmin ? "Admin operations" : "Dealer account"}
        title="Notifications"
        description={`${unreadCount} unread${isAdmin ? ` · ${urgentCount} operational alerts` : ""}`}
        actions={
          <button
            className="inline-flex h-10 items-center gap-2 rounded-md border border-border bg-background px-4 text-sm font-black text-primary transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-60"
            disabled={isLoading}
            onClick={() => void notificationsQuery.refetch()}
            type="button"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh
          </button>
        }
      />

      {message && (
        <section className={`rounded-xl border px-4 py-3 text-sm font-bold ${message.includes("could not") || message.includes("disabled") ? "border-[hsl(var(--status-danger)/0.24)] bg-[hsl(var(--status-danger)/0.08)] text-[hsl(var(--status-danger))]" : "border-[hsl(var(--status-success)/0.24)] bg-[hsl(var(--status-success)/0.08)] text-[hsl(var(--status-success))]"}`}>
          {message}
        </section>
      )}

      <section className="rounded-2xl border border-border bg-card p-5 shadow-sm shadow-primary/5">
        {isLoading ? (
          <div className="h-48 animate-pulse rounded-lg bg-muted" />
        ) : notifications.length === 0 ? (
          <div className="grid min-h-56 place-items-center rounded-2xl bg-muted p-8 text-center">
            <div>
              <Bell className="mx-auto mb-4 h-12 w-12 text-primary/35" />
              <p className="font-bold text-muted-foreground">No notifications yet.</p>
            </div>
          </div>
        ) : (
          <div className="grid gap-3">
            {notifications.map((notification) => (
              <NotificationCard
                isDeleting={deleteNotificationMutation.isPending && notificationToDelete?.id === notification.id}
                key={notification.id}
                markAsRead={markAsRead}
                notification={notification}
                requestDeleteNotification={setNotificationToDelete}
              />
            ))}
          </div>
        )}
      </section>

      <AlertDialog
        confirmLabel="Delete notification"
        description={
          notificationToDelete
            ? `"${notificationToDelete.title}" will be permanently removed from this notification list.`
            : "This notification will be permanently removed."
        }
        loading={deleteNotificationMutation.isPending}
        onConfirm={() => void deleteNotification()}
        onOpenChange={(open) => {
          if (!open && !deleteNotificationMutation.isPending) setNotificationToDelete(null);
        }}
        open={Boolean(notificationToDelete)}
        title="Delete notification?"
        tone="destructive"
      />
    </div>
  );
}

function NotificationCard({
  isDeleting,
  markAsRead,
  notification,
  requestDeleteNotification,
}: {
  isDeleting: boolean;
  markAsRead: (id: string) => Promise<void>;
  notification: Notification;
  requestDeleteNotification: (notification: Notification) => void;
}) {
  const style = notificationStyles[notification.type] || notificationStyles.new_order_admin;

  return (
    <Card className={`rounded-2xl border p-4 shadow-none ${style.border} ${notification.read ? "bg-card" : style.surface}`}>
      <div className="flex items-start gap-4">
        <div className={`grid h-11 w-11 flex-shrink-0 place-items-center rounded-xl bg-card ${style.icon}`}>
          {getNotificationIcon(notification.type)}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h2 className={`truncate text-base font-black ${notification.read ? "text-foreground/80" : "text-foreground"}`}>{notification.title}</h2>
                {!notification.read && <span className="h-2 w-2 flex-shrink-0 rounded-full bg-blue-600" />}
              </div>
              <p className="mt-1 text-sm font-semibold leading-6 text-muted-foreground">{notification.message}</p>
              <p className="mt-2 text-xs font-bold text-muted-foreground/80">
                {notificationLabels[notification.type]} · {formatDateTime(notification.createdAt)}
              </p>
            </div>
          </div>
        </div>
        <div className="flex flex-shrink-0 gap-2">
          {!notification.read && (
            <button
              aria-label={`Mark ${notification.title} as read`}
              className="grid h-9 w-9 place-items-center rounded-md border border-blue-200 bg-white text-blue-700 transition-colors hover:bg-blue-50"
              onClick={() => void markAsRead(notification.id)}
              type="button"
            >
              <CheckCircle className="h-4 w-4" />
            </button>
          )}
          <button
            aria-label={`Delete ${notification.title}`}
            className="grid h-9 w-9 place-items-center rounded-md border border-red-200 bg-white text-red-700 transition-colors hover:bg-red-50"
            disabled={isDeleting}
            onClick={() => requestDeleteNotification(notification)}
            type="button"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>
    </Card>
  );
}

function getNotificationIcon(type: Notification["type"]) {
  if (type === "order_created" || type === "order_status") return <Package className="h-5 w-5" />;
  if (type === "rental_expiring") return <Clock className="h-5 w-5" />;
  if (type === "low_stock") return <AlertTriangle className="h-5 w-5" />;
  return <Mail className="h-5 w-5" />;
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}
