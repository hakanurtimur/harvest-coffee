"use client";

import RentalCalendarV2Workspace from "@/components/RentalCalendarV2Workspace";
import LoadingState from "@/components/LoadingState";
import { getHarvestApi } from "@/lib/harvest-api";
import { useV2Enabled } from "@/lib/v2-pages";
import { Rental } from "@/lib/domain";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

const weekDays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export default function RentalCalendarWorkspace() {
  const v2Enabled = useV2Enabled("/rentalcalendar");

  if (v2Enabled) {
    return <RentalCalendarV2Workspace />;
  }

  return <LegacyRentalCalendarWorkspace />;
}

function LegacyRentalCalendarWorkspace() {
  const api = useMemo(() => getHarvestApi(), []);
  const [rentals, setRentals] = useState<Rental[]>([]);
  const [currentMonth, setCurrentMonth] = useState(() => new Date());
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    void loadRentals();
  }, []);

  const loadRentals = async () => {
    setIsLoading(true);
    setRentals(await api.getRentals());
    setIsLoading(false);
  };

  const calendarDays = getCalendarDays(currentMonth);
  const monthStart = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
  const monthEnd = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0);
  const todayKey = toDateKey(new Date());
  const totalActiveRentals = rentals.filter((rental) => getRentalPhase(rental, todayKey) === "active").length;
  const totalUpcomingRentals = rentals.filter((rental) => getRentalPhase(rental, todayKey) === "upcoming").length;
  const expiringThisMonth = rentals.filter((rental) => {
    const endDate = parseDateOnly(rental.endDate);
    return rental.status !== "cancelled" && endDate >= monthStart && endDate <= monthEnd;
  }).length;

  const navigateMonth = (direction: number) => {
    setCurrentMonth((month) => new Date(month.getFullYear(), month.getMonth() + direction, 1));
  };

  return (
    <>
      <header className="topbar">
        <div>
          <p>Admin</p>
          <h1>Rental calendar</h1>
        </div>
        <div className="topbar-actions">
          <button className="ghost-button" onClick={() => navigateMonth(-1)} aria-label="Previous month">
            <ChevronLeft size={16} />
          </button>
          <button className="ghost-button" onClick={() => setCurrentMonth(new Date())}>Today</button>
          <button className="ghost-button" onClick={() => navigateMonth(1)} aria-label="Next month">
            <ChevronRight size={16} />
          </button>
        </div>
      </header>

      {isLoading ? (
        <section className="orders-section">
          <LoadingState
            description="Fetching rental agreements and calendar availability."
            minHeight="min-h-[260px]"
            title="Loading rental calendar"
          />
        </section>
      ) : (
        <>
          <section className="dashboard-metrics report-metrics">
            <Metric label="Active rentals" value={String(totalActiveRentals)} />
            <Metric label="Upcoming" value={String(totalUpcomingRentals)} />
            <Metric label="Expiring this month" value={String(expiringThisMonth)} />
            <Metric label="Total rentals" value={String(rentals.length)} />
          </section>

          <section className="calendar-shell">
            <div className="calendar-title">
              <h2>{new Intl.DateTimeFormat("en-US", { month: "long", year: "numeric" }).format(currentMonth)}</h2>
            </div>
            <div className="calendar-weekdays">
              {weekDays.map((day) => <span key={day}>{day}</span>)}
            </div>
            <div className="calendar-grid">
              {calendarDays.map((day) => {
                const dateKey = toDateKey(day);
                const isCurrentMonth = day.getMonth() === currentMonth.getMonth();
                const isToday = toDateKey(day) === toDateKey(new Date());
                const activeRentals = getActiveRentalsForDay(rentals, dateKey, todayKey);
                const upcomingRentals = rentals.filter((rental) => dateKeyOf(rental.startDate) === dateKey && getRentalPhase(rental, todayKey) === "upcoming");
                const expiringRentals = rentals.filter((rental) => dateKeyOf(rental.endDate) === dateKey && rental.status !== "cancelled");

                return (
                  <article className={`calendar-day ${isCurrentMonth ? "" : "muted"} ${isToday ? "today" : ""}`} key={dateKey}>
                    <strong>{day.getDate()}</strong>
                    <div>
                      {activeRentals.slice(0, 3).map((rental) => <Event rental={rental} type="active" key={`active-${rental.id}`} />)}
                      {upcomingRentals.map((rental) => <Event rental={rental} type="upcoming" key={`upcoming-${rental.id}`} />)}
                      {expiringRentals.map((rental) => <Event rental={rental} type="expiring" key={`expiring-${rental.id}`} />)}
                      {activeRentals.length > 3 && <span className="more-pill">+{activeRentals.length - 3} more</span>}
                    </div>
                  </article>
                );
              })}
            </div>
          </section>

          <section className="calendar-legend">
            <span><i className="active" /> Active rental</span>
            <span><i className="upcoming" /> Starting today</span>
            <span><i className="expiring" /> Expiring today</span>
            <span><i className="today" /> Today</span>
          </section>
        </>
      )}
    </>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function Event({ rental, type }: { rental: Rental; type: "active" | "upcoming" | "expiring" }) {
  return (
    <span className={`calendar-event ${type}`} title={`${rental.productName} - ${rental.customerName || rental.customerEmail}`}>
      {type === "upcoming" ? "Start: " : type === "expiring" ? "End: " : ""}
      {rental.productName.split(" ").slice(0, 2).join(" ")}
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

function getActiveRentalsForDay(rentals: Rental[], dateKey: string, todayKey: string) {
  return rentals.filter((rental) => dateKey >= dateKeyOf(rental.startDate) && dateKey <= dateKeyOf(rental.endDate) && getRentalPhase(rental, todayKey) === "active");
}

function getRentalPhase(rental: Rental, todayKey: string): "active" | "upcoming" | "expired" | "cancelled" {
  if (rental.status === "cancelled") return "cancelled";
  const startDate = dateKeyOf(rental.startDate);
  const endDate = dateKeyOf(rental.endDate);
  if (todayKey < startDate) return "upcoming";
  if (todayKey > endDate || rental.status === "expired") return "expired";
  return "active";
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
