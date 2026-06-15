"use client";

import { Card } from "@/components/ui/card";
import { getHarvestApi } from "@/lib/harvest-api";
import type { AdminSettings } from "@harvest/domain";
import { AlertTriangle, Mail, Save } from "lucide-react";
import { FormEvent, useEffect, useMemo, useState } from "react";

const defaultSettings: AdminSettings = {
  adminNotificationEmail: "",
  rentalReminderDays: 3,
  appName: "Harvest Coffee",
};

export default function AdminSettingsV2Workspace() {
  const api = useMemo(() => getHarvestApi(), []);
  const [settings, setSettings] = useState<AdminSettings>(defaultSettings);
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const loadSettings = async () => {
    setIsLoading(true);
    setMessage("");
    const user = await api.getCurrentUser();
    setSettings(user?.adminSettings ?? defaultSettings);
    setIsLoading(false);
  };

  useEffect(() => {
    void loadSettings();
  }, []);

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
    <div className="space-y-5 text-[#3a2619]">
      <section className="rounded-lg border border-[#e8daca] bg-[#fffdf8] p-5 shadow-sm shadow-[#8a461c]/5 md:p-6">
        <p className="text-xs font-black uppercase tracking-[0.22em] text-[#b3692c]">Admin</p>
        <h1 className="mt-2 text-3xl font-black tracking-normal text-[#3a2619] md:text-4xl">Admin settings</h1>
      </section>

      {message && (
        <section className={`rounded-lg border px-4 py-3 text-sm font-bold ${message.includes("Error") || message.includes("disabled") ? "border-red-200 bg-red-50 text-red-800" : "border-green-200 bg-green-50 text-green-800"}`}>
          {message}
        </section>
      )}

      {isLoading ? (
        <section className="rounded-lg border border-[#e8daca] bg-[#fffdf8] p-5 shadow-sm shadow-[#8a461c]/5">
          <div className="h-48 animate-pulse rounded-lg bg-[#f3e8da]" />
        </section>
      ) : (
        <section className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
          <form className="overflow-hidden rounded-lg border border-[#e8daca] bg-[#fffdf8] shadow-sm shadow-[#8a461c]/5" onSubmit={saveSettings}>
            <header className="flex items-center gap-2 border-b border-[#eadccf] bg-[#fff8ed] px-5 py-4">
              <Mail className="h-5 w-5 text-[#8a461c]" />
              <div>
                <p className="text-xs font-black uppercase tracking-[0.2em] text-[#b3692c]">Notifications</p>
                <h2 className="text-lg font-black text-[#3a2619]">Email notifications</h2>
              </div>
            </header>

            <div className="grid gap-5 p-5">
              <label className="grid gap-2">
                <span className="text-sm font-black text-[#3a2619]">Admin notification email</span>
                <small className="text-xs font-semibold text-[#8f7461]">Email address where admin alerts and rental reminders will be sent.</small>
                <input
                  className="h-11 rounded-md border border-[#e3d1bd] bg-white px-3 text-sm font-semibold text-[#3a2619] outline-none transition-colors placeholder:text-[#b49d8b] focus:border-[#8a461c]"
                  onChange={(event) => setSettings({ ...settings, adminNotificationEmail: event.target.value })}
                  placeholder="admin@example.com"
                  type="email"
                  value={settings.adminNotificationEmail ?? ""}
                />
              </label>

              <label className="grid gap-2">
                <span className="text-sm font-black text-[#3a2619]">Rental reminder days before expiration</span>
                <small className="text-xs font-semibold text-[#8f7461]">Number of days before rental expiration to send reminder.</small>
                <input
                  className="h-11 rounded-md border border-[#e3d1bd] bg-white px-3 text-sm font-semibold text-[#3a2619] outline-none transition-colors focus:border-[#8a461c]"
                  max={30}
                  min={1}
                  onChange={(event) => setSettings({ ...settings, rentalReminderDays: Number.parseInt(event.target.value, 10) || 3 })}
                  type="number"
                  value={settings.rentalReminderDays}
                />
              </label>

              <button
                className="inline-flex h-11 w-fit items-center gap-2 rounded-md bg-[#7c3514] px-5 text-sm font-black text-white transition-colors hover:bg-[#5f260f] disabled:cursor-not-allowed disabled:opacity-60"
                disabled={isSaving}
                type="submit"
              >
                <Save className="h-4 w-4" />
                {isSaving ? "Saving..." : "Save settings"}
              </button>
            </div>
          </form>

          <Card className="rounded-lg border-[#d7e4f5] bg-blue-50 p-5 text-blue-950 shadow-none">
            <div className="flex gap-3">
              <div className="grid h-10 w-10 flex-shrink-0 place-items-center rounded-lg bg-blue-100 text-blue-700">
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
