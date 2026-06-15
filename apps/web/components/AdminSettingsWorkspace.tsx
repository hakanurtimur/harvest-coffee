"use client";

import AdminSettingsV2Workspace from "@/components/AdminSettingsV2Workspace";
import { getHarvestApi } from "@/lib/harvest-api";
import { useV2Enabled } from "@/lib/v2-pages";
import { AdminSettings } from "@/lib/domain";
import { AlertTriangle, Mail, Save } from "lucide-react";
import { FormEvent, useEffect, useMemo, useState } from "react";

const defaultSettings: AdminSettings = {
  adminNotificationEmail: "",
  rentalReminderDays: 3,
  appName: "Harvest Coffee",
};

export default function AdminSettingsWorkspace() {
  const v2Enabled = useV2Enabled("/adminsettings");

  if (v2Enabled) {
    return <AdminSettingsV2Workspace />;
  }

  return <LegacyAdminSettingsWorkspace />;
}

function LegacyAdminSettingsWorkspace() {
  const api = useMemo(() => getHarvestApi(), []);
  const [settings, setSettings] = useState<AdminSettings>(defaultSettings);
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    void loadSettings();
  }, []);

  const loadSettings = async () => {
    setIsLoading(true);
    setMessage("");
    const user = await api.getCurrentUser();
    setSettings(user?.adminSettings ?? defaultSettings);
    setIsLoading(false);
  };

  const saveSettings = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSaving(true);
    setMessage("");
    try {
      const updated = await api.updateCurrentUser({ adminSettings: settings });
      setSettings(updated.adminSettings ?? settings);
      setMessage("Settings saved successfully.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Error saving settings.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <>
      <header className="topbar">
        <div>
          <p>Admin</p>
          <h1>Admin settings</h1>
        </div>
      </header>

      {message && <section className={message.includes("Error") || message.includes("disabled") ? "notice error" : "notice"}>{message}</section>}

      {isLoading ? (
        <section className="orders-section">
          <div className="loading-panel">Loading settings...</div>
        </section>
      ) : (
        <section className="settings-shell">
          <form className="settings-panel" onSubmit={saveSettings}>
            <div className="section-head compact">
              <div>
                <p>Notifications</p>
                <h2><Mail size={18} /> Email notifications</h2>
              </div>
            </div>

            <label>
              <span>Admin notification email</span>
              <small>Email address where admin alerts and rental reminders will be sent.</small>
              <input
                type="email"
                value={settings.adminNotificationEmail ?? ""}
                onChange={(event) => setSettings({ ...settings, adminNotificationEmail: event.target.value })}
                placeholder="admin@example.com"
              />
            </label>

            <label>
              <span>Rental reminder days before expiration</span>
              <small>Number of days before rental expiration to send reminder.</small>
              <input
                type="number"
                min={1}
                max={30}
                value={settings.rentalReminderDays}
                onChange={(event) => setSettings({ ...settings, rentalReminderDays: Number.parseInt(event.target.value, 10) || 3 })}
              />
            </label>

            <button className="primary-button" disabled={isSaving} type="submit">
              <Save size={16} />
              {isSaving ? "Saving..." : "Save settings"}
            </button>
          </form>

          <aside className="settings-info">
            <AlertTriangle size={20} />
            <div>
              <h2>Rental reminder system</h2>
              <p>Reminders are configured from the admin profile settings and used by the existing Base44 reminder flow.</p>
              <ul>
                <li>Reminders are sent before rental expiration.</li>
                <li>Emails use the admin notification email.</li>
                <li>The reminder window is limited to 1-30 days.</li>
              </ul>
            </div>
          </aside>
        </section>
      )}
    </>
  );
}
