"use client";

import { Card } from "@/components/ui/card";
import { getHarvestApi } from "@/lib/harvest-api";
import type { Rental } from "@harvest/domain";
import { CalendarDays, ChevronLeft, ChevronRight, Clock, Package, TrendingUp } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

const weekDays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export default function RentalCalendarV2Workspace() {
  const api = useMemo(() => getHarvestApi(), []);
  const [rentals, setRentals] = useState<Rental[]>([]);
  const [currentMonth, setCurrentMonth] = useState(() => new Date());
  const [isLoading, setIsLoading] = useState(true);

  const loadRentals = async () => {
    setIsLoading(true);
    setRentals(await api.getRentals());
    setIsLoading(false);
  };

  useEffect(() => {
    void loadRentals();
  }, []);

  const calendarDays = getCalendarDays(currentMonth);
  const monthStart = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
  const monthEnd = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0);
  const totalActiveRentals = rentals.filter((rental) => rental.status === "active").length;
  const totalUpcomingRentals = rentals.filter((rental) => rental.status === "upcoming").length;
  const expiringThisMonth = rentals.filter((rental) => {
    const endDate = new Date(rental.endDate);
    return rental.status === "active" && endDate >= monthStart && endDate <= monthEnd;
  }).length;

  const navigateMonth = (direction: number) => {
    setCurrentMonth((month) => new Date(month.getFullYear(), month.getMonth() + direction, 1));
  };

  return (
    <div className="space-y-5 text-[#3a2619]">
      <section className="rounded-lg border border-[#e8daca] bg-[#fffdf8] p-5 shadow-sm shadow-[#8a461c]/5 md:p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.22em] text-[#b3692c]">Admin</p>
            <h1 className="mt-2 text-3xl font-black tracking-normal text-[#3a2619] md:text-4xl">Rental calendar</h1>
          </div>
          <div className="flex flex-wrap gap-2">
            <button aria-label="Previous month" className="grid h-10 w-10 place-items-center rounded-md border border-[#e3d1bd] bg-white text-[#7c3514] transition-colors hover:bg-[#fff8ed]" onClick={() => navigateMonth(-1)} type="button">
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button className="h-10 rounded-md border border-[#e3d1bd] bg-white px-4 text-sm font-black text-[#7c3514] transition-colors hover:bg-[#fff8ed]" onClick={() => setCurrentMonth(new Date())} type="button">
              Today
            </button>
            <button aria-label="Next month" className="grid h-10 w-10 place-items-center rounded-md border border-[#e3d1bd] bg-white text-[#7c3514] transition-colors hover:bg-[#fff8ed]" onClick={() => navigateMonth(1)} type="button">
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </section>

      {isLoading ? (
        <section className="rounded-lg border border-[#e8daca] bg-[#fffdf8] p-5 shadow-sm shadow-[#8a461c]/5">
          <div className="h-48 animate-pulse rounded-lg bg-[#f3e8da]" />
        </section>
      ) : (
        <>
          <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <Metric label="Active rentals" value={String(totalActiveRentals)} icon={Package} tone="green" />
            <Metric label="Upcoming" value={String(totalUpcomingRentals)} icon={Clock} tone="blue" />
            <Metric label="Expiring this month" value={String(expiringThisMonth)} icon={CalendarDays} tone="orange" />
            <Metric label="Total rentals" value={String(rentals.length)} icon={TrendingUp} tone="amber" />
          </section>

          <section className="overflow-hidden rounded-lg border border-[#e8daca] bg-[#fffdf8] shadow-sm shadow-[#8a461c]/5">
            <header className="border-b border-[#eadccf] px-5 py-4">
              <h2 className="text-lg font-black text-[#3a2619]">
                {new Intl.DateTimeFormat("en-US", { month: "long", year: "numeric" }).format(currentMonth)}
              </h2>
            </header>
            <div className="overflow-x-auto">
              <div className="min-w-[860px]">
                <div className="grid grid-cols-7 border-b border-[#eadccf] bg-[#fff8ed]">
                  {weekDays.map((day) => (
                    <span className="p-3 text-center text-sm font-black text-[#5c3a25]" key={day}>{day}</span>
                  ))}
                </div>
                <div className="grid grid-cols-7">
                  {calendarDays.map((day) => {
                    const dateKey = toDateKey(day);
                    const isCurrentMonth = day.getMonth() === currentMonth.getMonth();
                    const isToday = toDateKey(day) === toDateKey(new Date());
                    const activeRentals = getActiveRentalsForDay(rentals, dateKey);
                    const upcomingRentals = rentals.filter((rental) => rental.startDate === dateKey && rental.status === "upcoming");
                    const expiringRentals = rentals.filter((rental) => rental.endDate === dateKey && rental.status === "active");

                    return (
                      <article className={`min-h-32 border-b border-r border-[#f0e2d4] p-2 ${isCurrentMonth ? "bg-white" : "bg-[#fbf4ea] text-[#b49d8b]"} ${isToday ? "bg-[#fff8ed]" : ""}`} key={dateKey}>
                        <div className="mb-2 flex items-center justify-between">
                          <strong className={`grid h-7 w-7 place-items-center rounded-full text-sm ${isToday ? "bg-[#7c3514] text-white" : isCurrentMonth ? "text-[#3a2619]" : "text-[#b49d8b]"}`}>
                            {day.getDate()}
                          </strong>
                        </div>
                        <div className="space-y-1">
                          {activeRentals.slice(0, 3).map((rental) => <Event rental={rental} type="active" key={`active-${rental.id}`} />)}
                          {upcomingRentals.map((rental) => <Event rental={rental} type="upcoming" key={`upcoming-${rental.id}`} />)}
                          {expiringRentals.map((rental) => <Event rental={rental} type="expiring" key={`expiring-${rental.id}`} />)}
                          {activeRentals.length > 3 && <span className="inline-flex rounded-md border border-[#e3d1bd] bg-white px-2 py-1 text-xs font-black text-[#7c3514]">+{activeRentals.length - 3} more</span>}
                        </div>
                      </article>
                    );
                  })}
                </div>
              </div>
            </div>
          </section>

          <section className="flex flex-wrap gap-3 rounded-lg border border-[#e8daca] bg-[#fffdf8] p-4 text-sm font-bold text-[#6d5444] shadow-sm shadow-[#8a461c]/5">
            <LegendItem className="border-green-300 bg-green-100" label="Active rental" />
            <LegendItem className="border-blue-300 bg-blue-100" label="Starting today" />
            <LegendItem className="border-orange-300 bg-orange-100" label="Expiring today" />
            <LegendItem className="border-[#c99d70] bg-[#fff8ed]" label="Today" />
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

function Event({ rental, type }: { rental: Rental; type: "active" | "upcoming" | "expiring" }) {
  const styles = {
    active: "border-green-200 bg-green-50 text-green-800",
    upcoming: "border-blue-200 bg-blue-50 text-blue-800",
    expiring: "border-orange-200 bg-orange-50 text-orange-800",
  };

  return (
    <span className={`block truncate rounded-md border px-2 py-1 text-xs font-black ${styles[type]}`} title={`${rental.productName} - ${rental.customerName || rental.customerEmail}`}>
      {type === "upcoming" ? "Start: " : type === "expiring" ? "End: " : ""}
      {rental.productName.split(" ").slice(0, 2).join(" ")}
    </span>
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

function getActiveRentalsForDay(rentals: Rental[], dateKey: string) {
  return rentals.filter((rental) => dateKey >= rental.startDate && dateKey <= rental.endDate && rental.status === "active");
}

function toDateKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}
