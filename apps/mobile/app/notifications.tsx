import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Badge, Card, colors, ConfirmDialog, EmptyState, fontFamilies, ScrollContent, SectionTitle, formatDate, styles } from "../components/ui";
import { useMobileState } from "../lib/mobile-state";

export default function NotificationsScreen() {
  const { currentUser, deleteNotification, markNotificationRead, notifications } = useMobileState();
  const [busyId, setBusyId] = useState<string | null>(null);
  const [deleteCandidateId, setDeleteCandidateId] = useState<string | null>(null);
  const isAdmin = currentUser?.role === "admin";
  const deleteCandidate = notifications.find((notification) => notification.id === deleteCandidateId) ?? null;

  const markRead = async (id: string) => {
    setBusyId(id);
    try {
      await markNotificationRead(id);
    } catch {
      // Global feedback handles API failures.
    } finally {
      setBusyId(null);
    }
  };

  const remove = async (id: string) => {
    setBusyId(id);
    try {
      await deleteNotification(id);
      setDeleteCandidateId(null);
    } catch {
      // Global feedback handles API failures.
    } finally {
      setBusyId(null);
    }
  };

  const confirmRemove = (id: string) => {
    setDeleteCandidateId(id);
  };

  return (
    <ScrollContent>
      <SectionTitle eyebrow={isAdmin ? "Admin" : "Activity"} title="Notifications" />
      {notifications.length === 0 ? (
        <EmptyState
          title="No notifications"
          body={isAdmin ? "Admin alerts for orders, stock, and rentals will appear here." : "Dealer order and rental notifications will appear here."}
        />
      ) : (
        notifications.map((notification) => (
          <Card key={notification.id}>
            <View style={styles.rowBetween}>
              <View style={styles.flex}>
                <Text style={styles.cardTitle}>{notification.title}</Text>
                <Text style={styles.muted}>{formatDate(notification.createdAt)}</Text>
              </View>
              <Badge label={notification.read ? "Read" : "Unread"} />
            </View>
            <Text style={styles.description}>{notification.message}</Text>
            <View style={notificationStyles.actions}>
              {!notification.read ? (
                <Pressable
                  accessibilityRole="button"
                  accessibilityState={{ disabled: busyId === notification.id }}
                  disabled={busyId === notification.id}
                  onPress={() => markRead(notification.id)}
                  style={({ pressed }) => [notificationStyles.action, pressed && styles.pressed, busyId === notification.id && styles.disabled]}
                >
                  <Text style={notificationStyles.actionText}>Mark read</Text>
                </Pressable>
              ) : null}
              <Pressable
                accessibilityRole="button"
                accessibilityState={{ disabled: busyId === notification.id }}
                disabled={busyId === notification.id}
                onPress={() => confirmRemove(notification.id)}
                style={({ pressed }) => [notificationStyles.action, pressed && styles.pressed, busyId === notification.id && styles.disabled]}
              >
                <Text style={notificationStyles.actionText}>Delete</Text>
              </Pressable>
            </View>
          </Card>
        ))
      )}
      <ConfirmDialog
        body={deleteCandidate ? `${deleteCandidate.title} will be removed from your list.` : "This notification will be removed from your list."}
        confirmLabel="Delete"
        confirming={Boolean(deleteCandidateId && busyId === deleteCandidateId)}
        destructive
        onCancel={() => {
          if (!(deleteCandidateId && busyId === deleteCandidateId)) setDeleteCandidateId(null);
        }}
        onConfirm={() => {
          if (deleteCandidateId) void remove(deleteCandidateId);
        }}
        title="Delete notification?"
        visible={Boolean(deleteCandidateId)}
      />
    </ScrollContent>
  );
}

const notificationStyles = StyleSheet.create({
  action: {
    borderColor: colors.borderWarm,
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  actionText: {
    color: colors.primary,
    fontSize: 12,
    fontFamily: fontFamilies.semiBold,
  },
  actions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
});
