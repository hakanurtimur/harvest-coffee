import { AdminSettings } from "@harvest/domain";
import { useEffect, useState } from "react";
import { Alert, Pressable, StyleSheet, Text, View } from "react-native";
import { AdminShell } from "../components/admin-shell";
import { Card, Field, ScrollContent, SectionTitle, StatusBanner, styles } from "../components/ui";
import { useMobileState } from "../lib/mobile-state";

const defaultSettings: AdminSettings = {
  adminNotificationEmail: "",
  appName: "Harvest Coffee",
  rentalReminderDays: 3,
};

export default function AdminSettingsScreen() {
  const { currentUser, saveAdminSettings } = useMobileState();
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState<AdminSettings>(currentUser?.adminSettings ?? defaultSettings);

  useEffect(() => {
    setSettings(currentUser?.adminSettings ?? defaultSettings);
  }, [currentUser?.adminSettings]);

  const save = async () => {
    const rentalReminderDays = Math.min(30, Math.max(1, Number(settings.rentalReminderDays) || 3));
    const nextSettings = {
      ...settings,
      adminNotificationEmail: settings.adminNotificationEmail?.trim() ?? "",
      appName: settings.appName || "Harvest Coffee",
      rentalReminderDays,
    };

    setSaving(true);
    setMessage("");
    try {
      await saveAdminSettings(nextSettings);
      setSettings(nextSettings);
      setMessage("Settings saved successfully.");
    } catch (error) {
      Alert.alert("Settings failed", error instanceof Error ? error.message : "Error saving settings.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <AdminShell title="Settings">
      <ScrollContent>
        <SectionTitle eyebrow="Admin" title="Admin settings" />
        {message ? <StatusBanner tone="success" title={message} /> : null}
        <Card>
          <Text style={styles.cardTitle}>Email notifications</Text>
          <Text style={styles.description}>Email address where admin alerts and rental reminders will be sent.</Text>
          <Field
            autoCapitalize="none"
            keyboardType="email-address"
            onChangeText={(adminNotificationEmail) => setSettings({ ...settings, adminNotificationEmail })}
            placeholder="admin@example.com"
            value={settings.adminNotificationEmail ?? ""}
          />
          <Text style={styles.description}>Number of days before rental expiration to send reminder.</Text>
          <Field
            keyboardType="number-pad"
            onChangeText={(value) => setSettings({ ...settings, rentalReminderDays: Number.parseInt(value, 10) || 3 })}
            placeholder="3"
            value={String(settings.rentalReminderDays)}
          />
          <Pressable accessibilityRole="button" disabled={saving} onPress={() => void save()} style={({ pressed }) => [styles.primaryButton, pressed && !saving && styles.pressed, saving && styles.disabled]}>
            <Text style={styles.primaryButtonText}>{saving ? "Saving..." : "Save settings"}</Text>
          </Pressable>
        </Card>

        <Card>
          <Text style={styles.cardTitle}>Rental reminder system</Text>
          <View style={settingStyles.list}>
            <Text style={styles.description}>Reminders are configured from the admin profile settings and used by the existing Base44 reminder flow.</Text>
            <Text style={styles.description}>Emails use the admin notification email.</Text>
            <Text style={styles.description}>The reminder window is limited to 1-30 days.</Text>
          </View>
        </Card>
      </ScrollContent>
    </AdminShell>
  );
}

const settingStyles = StyleSheet.create({
  list: {
    gap: 8,
  },
});
