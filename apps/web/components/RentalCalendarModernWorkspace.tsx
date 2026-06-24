"use client";

import { Card } from "@/components/ui/card";
import AdminPageHeader from "@/components/AdminPageHeader";
import { useRentalsQuery } from "@/lib/harvest-query";
import type { Rental } from "@/lib/domain";
import { CalendarDays, ChevronLeft, ChevronRight, Clock, Package, RefreshCw, TrendingUp } from "lucide-react";
import { useEffect, useState } from "react";

const weekDays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export default function RentalCalendarModernWorkspace() {
  const rentalsQuery = useRentalsQuery();
  const [currentMonth, setCurrentMonth] = useState(() => new Date());
  const [selectedDate, setSelectedDate] = useState(() => toDateKey(new Date()));
  const rentals = rentalsQuery.data ?? [];
  const isLoading = rentalsQuery.isLoading;
  const message = rentalsQuery.error instanceof Error ? rentalsQuery.error.message : "";

  useEffect(() => {
    if (!rentalsQuery.isSuccess || hasRentalsInMonth(rentals, currentMonth)) return;
    const nextMonth = getBestCalendarMonth(rentals);
    setSelectedDate(toDateKey(nextMonth));
    setCurrentMonth(nextMonth);
  }, [currentMonth, rentals, rentalsQuery.isSuccess]);

  const calendarDays = getCalendarDays(currentMonth);
  const monthStart = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
  const monthEnd = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0);
  const todayKey = toDateKey(new Date());
  const totalActiveRentals = rentals.filter((rental) => getRentalPhase(rental, todayKey) === "active").length;
  const totalUpcomingRentals = rentals.filter((rental) => getRentalPhase(rental, todayKey) === "upcoming").length;
  const expiringThisMonth = rentals.filter((rental) => {
    const endDate = parseDateOnly(rental.endDate);
    return !isRentalCancelled(rental) && endDate >= monthStart && endDate <= monthEnd;
  }).length;
  const selectedDayRentals = rentals
    .filter((rental) => isRentalOnDate(rental, selectedDate))
    .sort((a, b) => dateKeyOf(a.startDate).localeCompare(dateKeyOf(b.startDate)));

  const navigateMonth = (direction: number) => {
    setCurrentMonth((month) => new Date(month.getFullYear(), month.getMonth() + direction, 1));
  };

  return (
    <div className="harvest-theme space-y-5 text-foreground">
      <AdminPageHeader
        title="Rental calendar"
        description="Calendar view for active, upcoming, and expiring rental agreements"
        actions={
          <>
            <button aria-label="Previous month" className="grid h-10 w-10 place-items-center rounded-md border border-border bg-background text-primary transition-colors hover:bg-muted" onClick={() => navigateMonth(-1)} type="button">
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button className="h-10 rounded-md border border-border bg-background px-4 text-sm font-black text-primary transition-colors hover:bg-muted" onClick={() => {
              const today = new Date();
              setCurrentMonth(today);
              setSelectedDate(toDateKey(today));
            }} type="button">
              Today
            </button>
            <button aria-label="Refresh rentals" className="grid h-10 w-10 place-items-center rounded-md border border-border bg-background text-primary transition-colors hover:bg-muted" onClick={() => void rentalsQuery.refetch()} type="button">
              <RefreshCw className="h-4 w-4" />
            </button>
            <button aria-label="Next month" className="grid h-10 w-10 place-items-center rounded-md border border-border bg-background text-primary transition-colors hover:bg-muted" onClick={() => navigateMonth(1)} type="button">
              <ChevronRight className="h-4 w-4" />
            </button>
          </>
        }
      />

      {message && (
        <section className="rounded-xl border border-[hsl(var(--status-danger)/0.24)] bg-[hsl(var(--status-danger)/0.08)] px-4 py-3 text-sm font-bold text-[hsl(var(--status-danger))]">
          {message}
        </section>
      )}

      {isLoading ? (
        <section className="rounded-2xl border border-border bg-card p-5 shadow-sm shadow-primary/5">
          <div className="h-48 animate-pulse rounded-lg bg-muted" />
        </section>
      ) : (
        <>
          <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <Metric label="Active rentals" value={String(totalActiveRentals)} icon={Package} tone="green" />
            <Metric label="Upcoming" value={String(totalUpcomingRentals)} icon={Clock} tone="blue" />
            <Metric label="Expiring this month" value={String(expiringThisMonth)} icon={CalendarDays} tone="orange" />
            <Metric label="Total rentals" value={String(rentals.length)} icon={TrendingUp} tone="amber" />
          </section>

          <section className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_320px]">
            <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm shadow-primary/5">
              <header className="border-b border-border px-5 py-4">
                <h2 className="text-lg font-black text-foreground">
                  {new Intl.DateTimeFormat("en-US", { month: "long", year: "numeric" }).format(currentMonth)}
                </h2>
              </header>
              <div className="overflow-x-auto">
                <div className="min-w-[860px]">
                  <div className="grid grid-cols-7 border-b border-border bg-muted">
                    {weekDays.map((day) => (
                      <span className="p-3 text-center text-sm font-black text-foreground" key={day}>{day}</span>
                    ))}
                  </div>
                  <div className="grid grid-cols-7">
                    {calendarDays.map((day) => {
                      const dateKey = toDateKey(day);
                      const isCurrentMonth = day.getMonth() === currentMonth.getMonth();
                      const isToday = dateKey === todayKey;
                      const isSelected = dateKey === selectedDate;
                      const dayRentals = rentals.filter((rental) => isRentalOnDate(rental, dateKey));

                      return (
                        <button
                          className={`min-h-32 border-b border-r border-border p-2 text-left transition-colors hover:bg-muted ${isCurrentMonth ? "bg-card" : "bg-muted/45 text-muted-foreground"} ${isToday ? "bg-muted" : ""} ${isSelected ? "ring-2 ring-inset ring-primary" : ""}`}
                          key={dateKey}
                          onClick={() => setSelectedDate(dateKey)}
                          type="button"
                        >
                          <div className="mb-2 flex items-center justify-between">
                            <strong className={`grid h-7 w-7 place-items-center rounded-full text-sm ${isToday ? "bg-primary text-primary-foreground" : isCurrentMonth ? "text-foreground" : "text-muted-foreground"}`}>
                              {day.getDate()}
                            </strong>
                            {dayRentals.length > 0 && <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-black text-primary">{dayRentals.length}</span>}
                          </div>
                          <div className="space-y-1">
                            {dayRentals.slice(0, 3).map((rental) => (
                              <Event dateKey={dateKey} rental={rental} todayKey={todayKey} key={`${dateKey}-${rental.id}`} />
                            ))}
                            {dayRentals.length > 3 && <span className="inline-flex rounded-md border border-border bg-background px-2 py-1 text-xs font-black text-primary">+{dayRentals.length - 3} more</span>}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>

            <aside className="rounded-2xl border border-border bg-card p-4 shadow-sm shadow-primary/5">
              <p className="text-xs font-black uppercase tracking-[0.18em] text-primary">Selected day</p>
              <h2 className="mt-2 text-xl font-black text-foreground">{formatLongDate(selectedDate)}</h2>
              <div className="mt-4 space-y-3">
                {selectedDayRentals.length === 0 ? (
                  <p className="rounded-xl bg-muted p-4 text-sm font-semibold text-muted-foreground">No rentals scheduled for this day.</p>
                ) : selectedDayRentals.map((rental) => (
                  <SelectedRental rental={rental} todayKey={todayKey} key={rental.id} />
                ))}
              </div>
            </aside>
          </section>

          <section className="flex flex-wrap gap-3 rounded-2xl border border-border bg-card p-4 text-sm font-bold text-muted-foreground shadow-sm shadow-primary/5">
            <LegendItem className="border-green-300 bg-green-100" label="Active" />
            <LegendItem className="border-blue-300 bg-blue-100" label="Upcoming" />
            <LegendItem className="border-orange-300 bg-orange-100" label="Ending" />
            <LegendItem className="border-red-300 bg-red-100" label="Expired/cancelled" />
            <LegendItem className="border-primary bg-muted" label="Today" />
          </section>
        </>
      )}
    </div>
  );
}

function Metric({ icon: Icon, label, tone, value }: { icon: React.ComponentType<{ className?: string }>; label: string; tone: "green" | "blue" | "orange" | "amber"; value: string }) {
  const tones = {
    green: "border-green-100 bg-green-50 text-green-950",
    blue: "border-blue-100 bg-blue-50 text-blue-950",
    orange: "border-orange-100 bg-orange-50 text-orange-950",
    amber: "border-amber-100 bg-amber-50 text-amber-950",
  };

  return (
    <Card className={`rounded-lg p-5 shadow-none ${tones[tone]}`}>
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-sm font-bold opacity-70">{label}</p>
          <strong className="mt-2 block text-3xl font-black">{value}</strong>
        </div>
        <Icon className="h-10 w-10 flex-shrink-0 opacity-45" />
      </div>
    </Card>
  );
}

function Event({ dateKey, rental, todayKey }: { dateKey: string; rental: Rental; todayKey: string }) {
  const type = getEventType(rental, dateKey, todayKey);
  const styles = {
    active: "border-green-200 bg-green-50 text-green-800",
    upcoming: "border-blue-200 bg-blue-50 text-blue-800",
    ending: "border-orange-200 bg-orange-50 text-orange-800",
    expired: "border-red-200 bg-red-50 text-red-800",
    cancelled: "border-stone-200 bg-stone-100 text-stone-700",
  };

  return (
    <span className={`block truncate rounded-md border px-2 py-1 text-xs font-black ${styles[type]}`} title={`${rental.productName} - ${rental.customerName || rental.customerEmail}`}>
      {dateKey === dateKeyOf(rental.startDate) ? "Start: " : dateKey === dateKeyOf(rental.endDate) ? "End: " : ""}
      {rental.productName.split(" ").slice(0, 2).join(" ")}
    </span>
  );
}

function SelectedRental({ rental, todayKey }: { rental: Rental; todayKey: string }) {
  const phase = getRentalPhase(rental, todayKey);
  return (
    <article className="rounded-xl border border-border bg-background p-3">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-sm font-black text-foreground">{rental.productName}</h3>
          <p className="mt-1 text-xs font-bold text-muted-foreground">{rental.customerName || rental.customerEmail}</p>
        </div>
        <span className="rounded-full bg-muted px-2 py-1 text-[10px] font-black uppercase text-primary">{phase}</span>
      </div>
      <p className="mt-3 text-xs font-semibold text-muted-foreground">
        {formatShortDate(dateKeyOf(rental.startDate))} - {formatShortDate(dateKeyOf(rental.endDate))}
      </p>
      {rental.notes && <p className="mt-2 text-xs leading-5 text-muted-foreground">{rental.notes}</p>}
    </article>
  );
}

function LegendItem({ className, label }: { className: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-2">
      <i className={`h-4 w-4 rounded border ${className}`} />
      {label}
    </span>
  );
}

function getCalendarDays(month: Date) {
  const first = new Date(month.getFullYear(), month.getMonth(), 1);
  const last = new Date(month.getFullYear(), month.getMonth() + 1, 0);
  const start = new Date(first);
  start.setDate(first.getDate() - first.getDay());
  const end = new Date(last);
  end.setDate(last.getDate() + (6 - last.getDay()));

  const days: Date[] = [];
  for (const day = new Date(start); day <= end; day.setDate(day.getDate() + 1)) {
    days.push(new Date(day));
  }
  return days;
}

function isRentalOnDate(rental: Rental, dateKey: string) {
  const startDate = dateKeyOf(rental.startDate);
  const endDate = dateKeyOf(rental.endDate);
  return dateKey >= startDate && dateKey <= endDate;
}

function getEventType(rental: Rental, dateKey: string, todayKey: string): "active" | "upcoming" | "ending" | "expired" | "cancelled" {
  if (isRentalCancelled(rental)) return "cancelled";
  if (dateKey === dateKeyOf(rental.endDate)) return "ending";
  return getRentalPhase(rental, todayKey);
}

function getRentalPhase(rental: Rental, todayKey: string): "active" | "upcoming" | "expired" | "cancelled" {
  if (isRentalCancelled(rental)) return "cancelled";
  const startDate = dateKeyOf(rental.startDate);
  const endDate = dateKeyOf(rental.endDate);
  if (todayKey < startDate) return "upcoming";
  if (todayKey > endDate || rental.status === "expired") return "expired";
  return "active";
}

function isRentalCancelled(rental: Rental) {
  return rental.status === "cancelled";
}

function hasRentalsInMonth(rentals: Rental[], month: Date) {
  const monthStart = toDateKey(new Date(month.getFullYear(), month.getMonth(), 1));
  const monthEnd = toDateKey(new Date(month.getFullYear(), month.getMonth() + 1, 0));
  return rentals.some((rental) => dateKeyOf(rental.startDate) <= monthEnd && dateKeyOf(rental.endDate) >= monthStart);
}

function getBestCalendarMonth(rentals: Rental[]) {
  if (rentals.length === 0) return new Date();
  const todayKey = toDateKey(new Date());
  const nextRental = [...rentals]
    .filter((rental) => dateKeyOf(rental.endDate) >= todayKey)
    .sort((a, b) => dateKeyOf(a.startDate).localeCompare(dateKeyOf(b.startDate)))[0] ?? rentals[0];
  const date = parseDateOnly(nextRental.startDate);
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function dateKeyOf(value: string) {
  if (/^\d{4}-\d{2}-\d{2}/.test(value)) return value.slice(0, 10);
  return toDateKey(parseDateOnly(value));
}

function parseDateOnly(value: string) {
  const key = /^\d{4}-\d{2}-\d{2}/.test(value) ? value.slice(0, 10) : value;
  const date = new Date(`${key}T00:00:00`);
  return Number.isNaN(date.getTime()) ? new Date() : date;
}

function toDateKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function formatLongDate(dateKey: string) {
  return new Intl.DateTimeFormat("en-GB", { day: "2-digit", month: "long", year: "numeric" }).format(parseDateOnly(dateKey));
}

function formatShortDate(dateKey: string) {
  return new Intl.DateTimeFormat("en-GB", { day: "2-digit", month: "short" }).format(parseDateOnly(dateKey));
}
