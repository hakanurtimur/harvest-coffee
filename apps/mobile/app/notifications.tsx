import { useState } from "react";
import { Alert, Pressable, StyleSheet, Text, View } from "react-native";
import { DealerShell } from "../components/dealer-shell";
import { Badge, Card, EmptyState, ScrollContent, SectionTitle, formatDate, styles } from "../components/ui";
import { useMobileState } from "../lib/mobile-state";

export default function NotificationsScreen() {
  const { deleteNotification, markNotificationRead, notifications } = useMobileState();
  const [busyId, setBusyId] = useState<string | null>(null);

  const markRead = async (id: string) => {
    setBusyId(id);
    try {
      await markNotificationRead(id);
    } finally {
      setBusyId(null);
    }
  };

  const remove = async (id: string) => {
    setBusyId(id);
    try {
      await deleteNotification(id);
    } catch (error) {
      Alert.alert("Delete failed", error instanceof Error ? error.message : "Notification could not be deleted.");
    } finally {
      setBusyId(null);
    }
  };

  return (
    <DealerShell title="Notifications">
      <ScrollContent>
        <SectionTitle eyebrow="Activity" title="Notifications" />
        {notifications.length === 0 ? (
          <EmptyState title="No notifications" body="Dealer notifications will appear here." />
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
                  onPress={() => remove(notification.id)}
                  style={({ pressed }) => [notificationStyles.action, pressed && styles.pressed, busyId === notification.id && styles.disabled]}
                >
                  <Text style={notificationStyles.actionText}>Delete</Text>
                </Pressable>
              </View>
            </Card>
          ))
        )}
      </ScrollContent>
    </DealerShell>
  );
}

const notificationStyles = StyleSheet.create({
  action: {
    borderColor: "#d9c7b5",
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  actionText: {
    color: "#704118",
    fontSize: 12,
    fontWeight: "900",
  },
  actions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
});
