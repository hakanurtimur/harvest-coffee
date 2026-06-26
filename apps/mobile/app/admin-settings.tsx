import { Feather } from "@expo/vector-icons";
import { AdminSettings } from "@harvest/domain";
import { useEffect, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { colors, Field, fontFamilies, ScrollContent, SectionTitle, styles } from "../components/ui";
import { useMobileState } from "../lib/mobile-state";

const defaultSettings: AdminSettings = {
  adminNotificationEmail: "",
  appName: "Harvest Coffee",
  rentalReminderDays: 3,
};

const reminderRules = [
  "These preferences stay in the admin session until Base44 exposes a supported settings field.",
  "Live notification delivery still belongs to the Base44 notification functions.",
  "The reminder window is limited to 1-30 days.",
];

export default function AdminSettingsScreen() {
  const { currentUser, saveAdminSettings } = useMobileState();
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
    try {
      await saveAdminSettings(nextSettings);
      setSettings(nextSettings);
    } catch {
      // Global feedback handles API failures.
    } finally {
      setSaving(false);
    }
  };

  return (
    <ScrollContent>
      <SectionTitle eyebrow="Admin" title="Admin settings" />

      <View style={settingStyles.summaryCard}>
        <View style={settingStyles.summaryIcon}>
          <Feather color={colors.primary} name="settings" size={18} />
        </View>
        <View style={settingStyles.summaryCopy}>
          <Text style={settingStyles.summaryEyebrow}>Workspace</Text>
          <Text style={settingStyles.summaryTitle}>{settings.appName || "Harvest Coffee"}</Text>
          <Text style={settingStyles.summaryText}>Admin notifications and rental reminder preferences.</Text>
        </View>
      </View>

      <View style={settingStyles.formCard}>
        <View style={settingStyles.cardHeader}>
          <View style={settingStyles.cardHeaderIcon}>
            <Feather color={colors.primary} name="mail" size={17} />
          </View>
          <View style={settingStyles.cardHeaderCopy}>
            <Text style={settingStyles.cardEyebrow}>Notifications</Text>
            <Text style={settingStyles.cardTitle}>Email notifications</Text>
          </View>
        </View>

        <View style={settingStyles.fieldBlock}>
          <Text style={settingStyles.fieldLabel}>Admin notification email</Text>
          <Text style={settingStyles.fieldHelp}>Email address where admin alerts and rental reminders will be sent.</Text>
          <Field
            autoCapitalize="none"
            editable={!saving}
            keyboardType="email-address"
            onChangeText={(adminNotificationEmail) => setSettings((current) => ({ ...current, adminNotificationEmail }))}
            placeholder="admin@example.com"
            value={settings.adminNotificationEmail ?? ""}
          />
        </View>

        <View style={settingStyles.fieldBlock}>
          <Text style={settingStyles.fieldLabel}>Rental reminder days before expiration</Text>
          <Text style={settingStyles.fieldHelp}>Number of days before rental expiration to send reminder.</Text>
          <Field
            editable={!saving}
            keyboardType="number-pad"
            onChangeText={(value) => setSettings((current) => ({ ...current, rentalReminderDays: Number.parseInt(value, 10) || 3 }))}
            placeholder="3"
            value={String(settings.rentalReminderDays)}
          />
        </View>

        <Pressable accessibilityRole="button" disabled={saving} onPress={() => void save()} style={({ pressed }) => [settingStyles.saveButton, pressed && !saving && styles.pressed, saving && styles.disabled]}>
          <Feather color={colors.onPrimary} name="save" size={15} />
          <Text style={settingStyles.saveButtonText}>{saving ? "Saving..." : "Save settings"}</Text>
        </Pressable>
      </View>

      <View style={settingStyles.infoCard}>
        <View style={settingStyles.infoHeader}>
          <View style={settingStyles.infoIcon}>
            <Feather color={colors.status.info.color} name="alert-triangle" size={17} />
          </View>
          <View style={settingStyles.infoCopy}>
            <Text style={settingStyles.infoEyebrow}>Reminder system</Text>
            <Text style={settingStyles.infoTitle}>Rental reminder system</Text>
          </View>
        </View>

        <View style={settingStyles.ruleList}>
          {reminderRules.map((rule) => (
            <View key={rule} style={settingStyles.ruleRow}>
              <View style={settingStyles.ruleBullet}>
                <Feather color={colors.primary} name="check" size={12} />
              </View>
              <Text style={settingStyles.ruleText}>{rule}</Text>
            </View>
          ))}
        </View>
      </View>
    </ScrollContent>
  );
}

const settingStyles = StyleSheet.create({
  cardEyebrow: {
    color: colors.primary,
    fontFamily: fontFamilies.semiBold,
    fontSize: 10,
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  cardHeader: {
    alignItems: "center",
    backgroundColor: colors.surfaceSoft,
    borderColor: colors.border,
    borderRadius: 14,
    borderWidth: 1,
    flexDirection: "row",
    gap: 10,
    padding: 12,
  },
  cardHeaderCopy: {
    flex: 1,
    gap: 2,
    minWidth: 0,
  },
  cardHeaderIcon: {
    alignItems: "center",
    backgroundColor: colors.secondary,
    borderColor: colors.border,
    borderRadius: 13,
    borderWidth: 1,
    height: 40,
    justifyContent: "center",
    width: 40,
  },
  cardTitle: {
    color: colors.foreground,
    fontFamily: fontFamilies.bold,
    fontSize: 18,
    lineHeight: 23,
  },
  fieldBlock: {
    gap: 8,
  },
  fieldHelp: {
    color: colors.muted,
    fontFamily: fontFamilies.medium,
    fontSize: 12,
    lineHeight: 18,
  },
  fieldLabel: {
    color: colors.foreground,
    fontFamily: fontFamilies.bold,
    fontSize: 14,
    lineHeight: 19,
  },
  formCard: {
    backgroundColor: colors.secondary,
    borderColor: colors.border,
    borderRadius: 15,
    borderWidth: 1,
    gap: 15,
    padding: 12,
  },
  infoCard: {
    backgroundColor: colors.status.info.background,
    borderColor: colors.status.info.border,
    borderRadius: 15,
    borderWidth: 1,
    gap: 14,
    padding: 12,
  },
  infoCopy: {
    flex: 1,
    gap: 2,
    minWidth: 0,
  },
  infoEyebrow: {
    color: colors.status.info.color,
    fontFamily: fontFamilies.semiBold,
    fontSize: 10,
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  infoHeader: {
    alignItems: "center",
    flexDirection: "row",
    gap: 10,
  },
  infoIcon: {
    alignItems: "center",
    backgroundColor: colors.secondary,
    borderColor: colors.status.info.border,
    borderRadius: 13,
    borderWidth: 1,
    height: 40,
    justifyContent: "center",
    width: 40,
  },
  infoTitle: {
    color: colors.foreground,
    fontFamily: fontFamilies.bold,
    fontSize: 17,
    lineHeight: 22,
  },
  ruleBullet: {
    alignItems: "center",
    backgroundColor: colors.secondary,
    borderColor: colors.border,
    borderRadius: 999,
    borderWidth: 1,
    height: 24,
    justifyContent: "center",
    width: 24,
  },
  ruleList: {
    gap: 10,
  },
  ruleRow: {
    alignItems: "flex-start",
    flexDirection: "row",
    gap: 9,
  },
  ruleText: {
    color: colors.foreground,
    flex: 1,
    fontFamily: fontFamilies.medium,
    fontSize: 13,
    lineHeight: 19,
  },
  saveButton: {
    alignItems: "center",
    backgroundColor: colors.primary,
    borderRadius: 13,
    flexDirection: "row",
    gap: 7,
    justifyContent: "center",
    minHeight: 46,
  },
  saveButtonText: {
    color: colors.onPrimary,
    fontFamily: fontFamilies.semiBold,
    fontSize: 13,
  },
  summaryCard: {
    alignItems: "center",
    backgroundColor: colors.secondary,
    borderColor: colors.border,
    borderRadius: 15,
    borderWidth: 1,
    flexDirection: "row",
    gap: 12,
    padding: 12,
  },
  summaryCopy: {
    flex: 1,
    gap: 3,
    minWidth: 0,
  },
  summaryEyebrow: {
    color: colors.primary,
    fontFamily: fontFamilies.semiBold,
    fontSize: 10,
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  summaryIcon: {
    alignItems: "center",
    backgroundColor: colors.surfaceSoft,
    borderColor: colors.border,
    borderRadius: 15,
    borderWidth: 1,
    height: 48,
    justifyContent: "center",
    width: 48,
  },
  summaryText: {
    color: colors.muted,
    fontFamily: fontFamilies.medium,
    fontSize: 12,
    lineHeight: 17,
  },
  summaryTitle: {
    color: colors.foreground,
    fontFamily: fontFamilies.bold,
    fontSize: 18,
    lineHeight: 23,
  },
});
