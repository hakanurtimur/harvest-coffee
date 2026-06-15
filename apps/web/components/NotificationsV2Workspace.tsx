"use client";

import { Card } from "@/components/ui/card";
import { getHarvestApi } from "@/lib/harvest-api";
import type { Notification } from "@harvest/domain";
import { AlertTriangle, Bell, CheckCircle, Clock, Mail, Package, RefreshCw, Trash2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

const fallbackEmail = "dealer@example.com";

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

export default function NotificationsV2Workspace() {
  const api = useMemo(() => getHarvestApi(), []);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  const loadNotifications = async () => {
    setIsLoading(true);
    setMessage("");
    const user = await api.getCurrentUser();
    setNotifications(await api.getNotifications(user?.email ?? fallbackEmail));
    setIsLoading(false);
  };

  useEffect(() => {
    void loadNotifications();
  }, []);

  const markAsRead = async (id: string) => {
    setMessage("");
    try {
      const updated = await api.markNotificationRead(id);
      setNotifications((current) => current.map((notification) => (notification.id === id ? updated : notification)));
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Notification could not be updated.");
    }
  };

  const deleteNotification = async (id: string) => {
    setMessage("");
    try {
      await api.deleteNotification(id);
      setNotifications((current) => current.filter((notification) => notification.id !== id));
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Notification could not be deleted.");
    }
  };

  const unreadCount = notifications.filter((notification) => !notification.read).length;

  return (
    <div className="space-y-5 text-[#3a2619]">
      <section className="rounded-lg border border-[#e8daca] bg-[#fffdf8] p-5 shadow-sm shadow-[#8a461c]/5 md:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.22em] text-[#b3692c]">Dealer account</p>
            <h1 className="mt-2 text-3xl font-black tracking-normal text-[#3a2619] md:text-4xl">Notifications</h1>
            <p className="mt-2 text-sm font-semibold text-[#8f7461]">{unreadCount} unread</p>
          </div>
          <button
            className="inline-flex h-10 items-center gap-2 rounded-md border border-[#e3d1bd] bg-white px-4 text-sm font-black text-[#7c3514] transition-colors hover:bg-[#fff8ed] disabled:cursor-not-allowed disabled:opacity-60"
            disabled={isLoading}
            onClick={loadNotifications}
            type="button"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh
          </button>
        </div>
      </section>

      {message && (
        <section className={`rounded-lg border px-4 py-3 text-sm font-bold ${message.includes("could not") || message.includes("disabled") ? "border-red-200 bg-red-50 text-red-800" : "border-green-200 bg-green-50 text-green-800"}`}>
          {message}
        </section>
      )}

      <section className="rounded-lg border border-[#e8daca] bg-[#fffdf8] p-5 shadow-sm shadow-[#8a461c]/5">
        {isLoading ? (
          <div className="h-48 animate-pulse rounded-lg bg-[#f3e8da]" />
        ) : notifications.length === 0 ? (
          <div className="grid min-h-56 place-items-center rounded-lg bg-[#fff8ed] p-8 text-center">
            <div>
              <Bell className="mx-auto mb-4 h-12 w-12 text-[#c8aa8f]" />
              <p className="font-bold text-[#8f7461]">No notifications yet.</p>
            </div>
          </div>
        ) : (
          <div className="grid gap-3">
            {notifications.map((notification) => (
              <NotificationCard
                deleteNotification={deleteNotification}
                key={notification.id}
                markAsRead={markAsRead}
                notification={notification}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function NotificationCard({
  deleteNotification,
  markAsRead,
  notification,
}: {
  deleteNotification: (id: string) => Promise<void>;
  markAsRead: (id: string) => Promise<void>;
  notification: Notification;
}) {
  const style = notificationStyles[notification.type] || notificationStyles.new_order_admin;

  return (
    <Card className={`rounded-lg border p-4 shadow-none ${style.border} ${notification.read ? "bg-white" : style.surface}`}>
      <div className="flex items-start gap-4">
        <div className={`grid h-11 w-11 flex-shrink-0 place-items-center rounded-lg bg-white ${style.icon}`}>
          {getNotificationIcon(notification.type)}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h2 className={`truncate text-base font-black ${notification.read ? "text-[#5c3a25]" : "text-[#3a2619]"}`}>{notification.title}</h2>
                {!notification.read && <span className="h-2 w-2 flex-shrink-0 rounded-full bg-blue-600" />}
              </div>
              <p className="mt-1 text-sm font-semibold leading-6 text-[#6d5444]">{notification.message}</p>
              <p className="mt-2 text-xs font-bold text-[#9a8373]">
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
            onClick={() => void deleteNotification(notification.id)}
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
