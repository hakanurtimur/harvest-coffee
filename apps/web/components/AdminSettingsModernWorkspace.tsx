"use client";

import { Card } from "@/components/ui/card";
import AdminPageHeader from "@/components/AdminPageHeader";
import { useCurrentUserQuery, useUpdateCurrentUserMutation } from "@/lib/harvest-query";
import type { AdminSettings } from "@/lib/domain";
import { AlertTriangle, Mail, Save } from "lucide-react";
import { FormEvent, useState } from "react";

const defaultSettings: AdminSettings = {
  adminNotificationEmail: "",
  rentalReminderDays: 3,
  appName: "Harvest Coffee",
};

export default function AdminSettingsModernWorkspace() {
  const currentUserQuery = useCurrentUserQuery();
  const updateCurrentUserMutation = useUpdateCurrentUserMutation();
  const [settings, setSettings] = useState<AdminSettings>(defaultSettings);
  const [settingsDirty, setSettingsDirty] = useState(false);
  const [message, setMessage] = useState("");
  const formSettings = settingsDirty ? settings : currentUserQuery.data?.adminSettings ?? settings;
  const isLoading = currentUserQuery.isLoading;
  const isSaving = updateCurrentUserMutation.isPending;

  const saveSettings = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setMessage("");
    try {
      const updated = await updateCurrentUserMutation.mutateAsync({ adminSettings: formSettings });
      setSettings(updated.adminSettings ?? formSettings);
      setSettingsDirty(false);
      setMessage("Settings saved successfully.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Error saving settings.");
    }
  };

  return (
    <div className="harvest-theme space-y-5 text-foreground">
      <AdminPageHeader title="Admin settings" description="Notification and rental reminder preferences" />

      {message && (
        <section className={`rounded-xl border px-4 py-3 text-sm font-bold ${message.includes("Error") || message.includes("disabled") ? "border-[hsl(var(--status-danger)/0.24)] bg-[hsl(var(--status-danger)/0.08)] text-[hsl(var(--status-danger))]" : "border-[hsl(var(--status-success)/0.24)] bg-[hsl(var(--status-success)/0.08)] text-[hsl(var(--status-success))]"}`}>
          {message}
        </section>
      )}

      {isLoading ? (
        <section className="rounded-2xl border border-border bg-card p-5 shadow-sm shadow-primary/5">
          <div className="h-48 animate-pulse rounded-lg bg-muted" />
        </section>
      ) : (
        <section className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
          <form className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm shadow-primary/5" onSubmit={saveSettings}>
            <header className="flex items-center gap-2 border-b border-border bg-muted px-5 py-4">
              <Mail className="h-5 w-5 text-primary" />
              <div>
                <p className="text-xs font-black uppercase tracking-[0.2em] text-primary">Notifications</p>
                <h2 className="text-lg font-black text-foreground">Email notifications</h2>
              </div>
            </header>

            <div className="grid gap-5 p-5">
              <label className="grid gap-2">
                <span className="text-sm font-black text-foreground">Admin notification email</span>
                <small className="text-xs font-semibold text-muted-foreground">Email address where admin alerts and rental reminders will be sent.</small>
                <input
                  className="h-11 rounded-md border border-border bg-background px-3 text-sm font-semibold text-foreground outline-none transition-colors placeholder:text-muted-foreground/70 focus:border-primary"
                  onChange={(event) => {
                    setSettingsDirty(true);
                    setSettings({ ...formSettings, adminNotificationEmail: event.target.value });
                  }}
                  placeholder="admin@example.com"
                  type="email"
                  value={formSettings.adminNotificationEmail ?? ""}
                />
              </label>

              <label className="grid gap-2">
                <span className="text-sm font-black text-foreground">Rental reminder days before expiration</span>
                <small className="text-xs font-semibold text-muted-foreground">Number of days before rental expiration to send reminder.</small>
                <input
                  className="h-11 rounded-md border border-border bg-background px-3 text-sm font-semibold text-foreground outline-none transition-colors focus:border-primary"
                  max={30}
                  min={1}
                  onChange={(event) => {
                    setSettingsDirty(true);
                    setSettings({ ...formSettings, rentalReminderDays: Number.parseInt(event.target.value, 10) || 3 });
                  }}
                  type="number"
                  value={formSettings.rentalReminderDays}
                />
              </label>

              <button
                className="inline-flex h-11 w-fit items-center gap-2 rounded-md bg-primary px-5 text-sm font-black text-primary-foreground transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
                disabled={isSaving}
                type="submit"
              >
                <Save className="h-4 w-4" />
                {isSaving ? "Saving..." : "Save settings"}
              </button>
            </div>
          </form>

          <Card className="rounded-2xl border-[hsl(var(--status-info)/0.24)] bg-[hsl(var(--status-info)/0.08)] p-5 text-[hsl(var(--status-info))] shadow-none">
            <div className="flex gap-3">
              <div className="grid h-10 w-10 flex-shrink-0 place-items-center rounded-lg bg-[hsl(var(--status-info)/0.12)] text-[hsl(var(--status-info))]">
                <AlertTriangle className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-base font-black">Rental reminder system</h2>
                <p className="mt-2 text-sm font-semibold leading-6">Reminders are configured from the admin profile settings and used by the existing Base44 reminder flow.</p>
                <ul className="mt-4 space-y-2 text-sm font-semibold">
                  <li>Reminders are sent before rental expiration.</li>
                  <li>Emails use the admin notification email.</li>
                  <li>The reminder window is limited to 1-30 days.</li>
                </ul>
              </div>
            </div>
          </Card>
        </section>
      )}
    </div>
  );
}
