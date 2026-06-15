"use client";

import NotificationsV2Workspace from "@/components/NotificationsV2Workspace";
import { getHarvestApi } from "@/lib/harvest-api";
import { useV2Enabled } from "@/lib/v2-pages";
import { Notification } from "@harvest/domain";
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
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    void loadNotifications();
  }, []);

  const loadNotifications = async () => {
    setIsLoading(true);
    setMessage("");
    const user = await api.getCurrentUser();
    setNotifications(await api.getNotifications(user?.email ?? fallbackEmail));
    setIsLoading(false);
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
    <>
      <header className="topbar">
        <div>
          <p>Dealer account</p>
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
          <div className="loading-panel">Loading notifications...</div>
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
                  <button className="icon-button danger" onClick={() => deleteNotification(notification.id)} aria-label={`Delete ${notification.title}`}>
                    <Trash2 size={16} />
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
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
