"use client";

import NotificationsV2Workspace from "@/components/NotificationsV2Workspace";
import LoadingState from "@/components/LoadingState";
import { AlertDialog } from "@/components/ui/alert-dialog";
import { getHarvestApi } from "@/lib/harvest-api";
import { useV2Enabled } from "@/lib/v2-pages";
import type { Notification, User } from "@/lib/domain";
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

export default function NotificationsWorkspace() {
  const v2Enabled = useV2Enabled("/notifications");

  if (v2Enabled) {
    return <NotificationsV2Workspace />;
  }

  return <LegacyNotificationsWorkspace />;
}

function LegacyNotificationsWorkspace() {
  const api = useMemo(() => getHarvestApi(), []);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [notificationToDelete, setNotificationToDelete] = useState<Notification | null>(null);
  const [deletingNotificationId, setDeletingNotificationId] = useState<string | null>(null);

  useEffect(() => {
    void loadNotifications();
  }, []);

  const loadNotifications = async () => {
    setIsLoading(true);
    setMessage("");
    try {
      const user = await api.getCurrentUser();
      setCurrentUser(user);
      const recipientEmail = user?.email ?? fallbackEmail;
      const nextNotifications = await api.getNotifications(recipientEmail, { includeAdmin: user?.role === "admin" });
      setNotifications([...nextNotifications].sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt)));
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Notifications could not be loaded.");
      setNotifications([]);
    } finally {
      setIsLoading(false);
    }
  };

  const markAsRead = async (id: string) => {
    setMessage("");
    try {
      const updated = await api.markNotificationRead(id);
      setNotifications((current) => current.map((notification) => (notification.id === id ? updated : notification)));
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Notification could not be updated.");
    }
  };

  const deleteNotification = async () => {
    if (!notificationToDelete) return;
    setMessage("");
    setDeletingNotificationId(notificationToDelete.id);
    try {
      await api.deleteNotification(notificationToDelete.id);
      setNotifications((current) => current.filter((notification) => notification.id !== notificationToDelete.id));
      setNotificationToDelete(null);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Notification could not be deleted.");
    } finally {
      setDeletingNotificationId(null);
    }
  };

  const unreadCount = notifications.filter((notification) => !notification.read).length;
  const isAdmin = currentUser?.role === "admin";

  return (
    <>
      <header className="topbar">
        <div>
          <p>{isAdmin ? "Admin operations" : "Dealer account"}</p>
          <h1>Notifications</h1>
        </div>
        <div className="topbar-actions">
          <strong>{unreadCount} unread</strong>
          <button className="ghost-button" onClick={loadNotifications} disabled={isLoading}>
            <RefreshCw size={16} />
            Refresh
          </button>
        </div>
      </header>

      {message && <section className={message.includes("could not") || message.includes("disabled") ? "notice error" : "notice"}>{message}</section>}

      <section className="orders-section notifications-shell">
        {isLoading ? (
          <LoadingState
            description="Fetching unread alerts and account notifications."
            minHeight="min-h-[260px]"
            title="Loading notifications"
          />
        ) : notifications.length === 0 ? (
          <div className="empty-state">
            <Bell size={42} />
            <p>No notifications yet.</p>
          </div>
        ) : (
          <div className="notification-list">
            {notifications.map((notification) => (
              <article className={`notification-card ${notification.type} ${notification.read ? "" : "unread"}`} key={notification.id}>
                <div className="notification-icon">{getNotificationIcon(notification.type)}</div>
                <div>
                  <div className="notification-title">
                    <h3>{notification.title}</h3>
                    {!notification.read && <span />}
                  </div>
                  <p>{notification.message}</p>
                  <small>
                    {notificationLabels[notification.type]} · {formatDateTime(notification.createdAt)}
                  </small>
                </div>
                <div className="row-actions">
                  {!notification.read && (
                    <button className="icon-button save" onClick={() => markAsRead(notification.id)} aria-label={`Mark ${notification.title} as read`}>
                      <CheckCircle size={16} />
                    </button>
                  )}
                  <button
                    className="icon-button danger"
                    disabled={deletingNotificationId === notification.id}
                    onClick={() => setNotificationToDelete(notification)}
                    aria-label={`Delete ${notification.title}`}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </article>
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
        loading={deletingNotificationId === notificationToDelete?.id}
        onConfirm={() => void deleteNotification()}
        onOpenChange={(open) => {
          if (!open && !deletingNotificationId) setNotificationToDelete(null);
        }}
        open={Boolean(notificationToDelete)}
        title="Delete notification?"
        tone="destructive"
      />
    </>
  );
}

function getNotificationIcon(type: Notification["type"]) {
  if (type === "order_created" || type === "order_status") return <Package size={22} />;
  if (type === "rental_expiring") return <Clock size={22} />;
  if (type === "low_stock") return <AlertTriangle size={22} />;
  return <Mail size={22} />;
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
