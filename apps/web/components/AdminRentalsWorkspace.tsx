"use client";

import AdminPageHeader from "@/components/AdminPageHeader";
import { AlertDialog } from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Combobox } from "@/components/ui/combobox";
import { getHarvestApi } from "@/lib/harvest-api";
import type { Rental } from "@/lib/domain";
import { AlertCircle, CalendarDays, CheckCircle2, Clock, Package, Plus, RefreshCw, Search, Trash2, XCircle } from "lucide-react";
import Link from "next/link";
import type { ComponentType } from "react";
import { useEffect, useMemo, useState } from "react";

const rentalStatusLabels: Record<Rental["status"], string> = {
  active: "Active",
  upcoming: "Upcoming",
  expired: "Expired",
  cancelled: "Cancelled",
};

const statusOptions: Array<Rental["status"]> = ["active", "upcoming", "expired", "cancelled"];
const rentalStatusComboboxOptions = statusOptions.map((status) => ({ label: rentalStatusLabels[status], value: status }));
const rentalStatusFilterOptions = [{ label: "All statuses", value: "all" }, ...rentalStatusComboboxOptions];

export default function AdminRentalsWorkspace() {
  const api = useMemo(() => getHarvestApi(), []);
  const [rentals, setRentals] = useState<Rental[]>([]);
  const [statusFilter, setStatusFilter] = useState<Rental["status"] | "all">("all");
  const [query, setQuery] = useState("");
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [savingRentalId, setSavingRentalId] = useState<string | null>(null);
  const [rentalToDelete, setRentalToDelete] = useState<Rental | null>(null);
  const [deletingRentalId, setDeletingRentalId] = useState<string | null>(null);

  useEffect(() => {
    void loadRentals();
  }, []);

  const loadRentals = async () => {
    setIsLoading(true);
    setMessage("");
    try {
      const nextRentals = await api.getRentals();
      setRentals([...nextRentals].sort((a, b) => Date.parse(a.startDate) - Date.parse(b.startDate)));
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Rentals could not be loaded.");
      setRentals([]);
    } finally {
      setIsLoading(false);
    }
  };

  const updateRentalStatus = async (id: string, status: Rental["status"]) => {
    setSavingRentalId(id);
    setMessage("");
    try {
      const updated = await api.updateRental(id, { status });
      setRentals((current) => current.map((rental) => (rental.id === id ? updated : rental)));
      setMessage(`${updated.productName} updated.`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Rental could not be updated.");
    } finally {
      setSavingRentalId(null);
    }
  };

  const deleteRental = async () => {
    if (!rentalToDelete) return;
    setMessage("");
    setDeletingRentalId(rentalToDelete.id);
    try {
      await api.deleteRental(rentalToDelete.id);
      setRentals((current) => current.filter((rental) => rental.id !== rentalToDelete.id));
      setMessage("Rental deleted.");
      setRentalToDelete(null);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Rental could not be deleted.");
    } finally {
      setDeletingRentalId(null);
    }
  };

  const filteredRentals = rentals.filter((rental) => {
    const statusMatches = statusFilter === "all" || rental.status === statusFilter;
    const searchText = `${rental.productName} ${rental.customerName ?? ""} ${rental.customerEmail} ${rental.notes ?? ""}`.toLowerCase();
    const queryMatches = searchText.includes(query.trim().toLowerCase());
    return statusMatches && queryMatches;
  });
  const activeCount = rentals.filter((rental) => rental.status === "active").length;
  const upcomingCount = rentals.filter((rental) => rental.status === "upcoming").length;
  const expiredCount = rentals.filter((rental) => rental.status === "expired").length;
  const endingSoonCount = rentals.filter((rental) => {
    const daysLeft = getDaysUntil(rental.endDate);
    return rental.status !== "cancelled" && daysLeft >= 0 && daysLeft <= 14;
  }).length;

  return (
    <div className="harvest-theme space-y-5 text-foreground">
      <AdminPageHeader
        title="Rental management"
        description="Manage rental agreements, lifecycle status, reminders, and calendar planning"
        actions={
          <>
            <Button className="h-10 rounded-md px-4" disabled={isLoading} onClick={loadRentals} variant="outline">
              <RefreshCw className="h-4 w-4" />
              Refresh
            </Button>
            <Button asChildShim className="h-10 rounded-md px-4" variant="outline">
              <Link href="/rentalcalendar">
                <CalendarDays className="h-4 w-4" />
                Calendar
              </Link>
            </Button>
            <Button asChildShim className="h-10 rounded-md px-4">
              <Link href="/CreateRental">
                <Plus className="h-4 w-4" />
                New rental
              </Link>
            </Button>
          </>
        }
      />

      {message && (
        <section
          className={`rounded-xl border px-4 py-3 text-sm font-bold ${
            message.includes("could not") || message.includes("disabled") || message.includes("loaded")
              ? "border-[hsl(var(--status-danger)/0.24)] bg-[hsl(var(--status-danger)/0.08)] text-[hsl(var(--status-danger))]"
              : "border-[hsl(var(--status-success)/0.24)] bg-[hsl(var(--status-success)/0.08)] text-[hsl(var(--status-success))]"
          }`}
        >
          {message}
        </section>
      )}

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard icon={Package} label="Total rentals" value={String(rentals.length)} tone="primary" />
        <MetricCard icon={CheckCircle2} label="Active rentals" value={String(activeCount)} tone="success" />
        <MetricCard icon={Clock} label="Upcoming" value={String(upcomingCount)} tone="info" />
        <MetricCard icon={AlertCircle} label="Ending soon" value={String(endingSoonCount)} tone="warning" />
      </section>

      <Card className="rounded-2xl border-border bg-card p-4 shadow-sm shadow-primary/5">
        <div className="flex flex-col gap-3 xl:flex-row xl:items-center">
          <label className="relative min-w-0 flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              className="h-11 w-full rounded-md border border-border bg-background pl-10 pr-3 text-sm font-semibold text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:border-primary"
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search product, customer, email, or notes"
              value={query}
            />
          </label>
          <label className="grid gap-1 sm:flex sm:items-center sm:gap-3">
            <span className="text-xs font-black uppercase tracking-[0.14em] text-muted-foreground">Status</span>
            <Combobox
              className="h-11 w-48 rounded-md"
              value={statusFilter}
              onChange={(value) => setStatusFilter(value as Rental["status"] | "all")}
              options={rentalStatusFilterOptions}
              placeholder="All statuses"
            />
          </label>
          <p className="text-sm font-semibold text-muted-foreground xl:ml-auto">
            <span className="font-black text-primary">{filteredRentals.length}</span> shown
          </p>
        </div>
      </Card>

      <section className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm shadow-primary/5">
        <header className="flex flex-col gap-3 border-b border-border px-5 py-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.18em] text-primary">Agreements</p>
            <h2 className="mt-1 text-xl font-black text-foreground">Rental queue</h2>
            <p className="mt-1 text-sm font-semibold text-muted-foreground">Review agreements, adjust statuses, and open the calendar from the header.</p>
          </div>
          {expiredCount > 0 && (
            <span className="inline-flex items-center gap-2 rounded-full border border-[hsl(var(--status-danger)/0.24)] bg-[hsl(var(--status-danger)/0.08)] px-3 py-1.5 text-xs font-black text-[hsl(var(--status-danger))]">
              <XCircle className="h-3.5 w-3.5" />
              {expiredCount} expired
            </span>
          )}
        </header>

        {isLoading ? (
          <div className="grid gap-3 p-5">
            {[0, 1, 2].map((item) => (
              <div className="h-28 animate-pulse rounded-xl bg-muted" key={item} />
            ))}
          </div>
        ) : filteredRentals.length === 0 ? (
          <EmptyRentals hasFilters={query.trim().length > 0 || statusFilter !== "all"} />
        ) : (
          <div className="grid gap-4 p-5">
            {filteredRentals.map((rental) => (
              <article className="rounded-2xl border border-border bg-card p-4 shadow-sm shadow-primary/5 transition-colors hover:border-primary/35" key={rental.id}>
                <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-lg font-black text-foreground">{rental.productName}</h3>
                      <StatusBadge status={rental.status} />
                    </div>
                    <div className="mt-3 grid gap-2 text-sm font-semibold text-muted-foreground md:grid-cols-2 xl:grid-cols-4">
                      <span>
                        <strong className="block text-xs font-black uppercase tracking-[0.12em] text-muted-foreground">Customer</strong>
                        <span className="text-foreground">{rental.customerName || "Unnamed customer"}</span>
                      </span>
                      <span>
                        <strong className="block text-xs font-black uppercase tracking-[0.12em] text-muted-foreground">Email</strong>
                        {rental.customerEmail}
                      </span>
                      <span>
                        <strong className="block text-xs font-black uppercase tracking-[0.12em] text-muted-foreground">Period</strong>
                        {formatDate(rental.startDate)} - {formatDate(rental.endDate)}
                      </span>
                      <span>
                        <strong className="block text-xs font-black uppercase tracking-[0.12em] text-muted-foreground">Reminder</strong>
                        {rental.reminderSent ? "Sent" : "Not sent"}
                      </span>
                    </div>
                    {rental.notes && <p className="mt-3 rounded-lg bg-muted px-3 py-2 text-sm font-semibold text-muted-foreground">{rental.notes}</p>}
                  </div>
                  <div className="flex flex-wrap items-center gap-2 xl:flex-nowrap">
                    <Combobox
                      className="h-10 w-44 rounded-md"
                      value={rental.status}
                      onChange={(value) => updateRentalStatus(rental.id, value as Rental["status"])}
                      options={rentalStatusComboboxOptions}
                      placeholder="Status"
                      disabled={savingRentalId === rental.id}
                      loading={savingRentalId === rental.id}
                    />
                    <button
                      className="grid h-10 w-10 place-items-center rounded-md text-[hsl(var(--status-danger))] transition-colors hover:bg-[hsl(var(--status-danger)/0.08)]"
                      disabled={savingRentalId === rental.id || deletingRentalId === rental.id}
                      onClick={() => setRentalToDelete(rental)}
                      aria-label={`Delete ${rental.productName}`}
                      type="button"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      <AlertDialog
        confirmLabel="Delete rental"
        description={
          rentalToDelete
            ? `${rentalToDelete.productName} rental for ${rentalToDelete.customerName || rentalToDelete.customerEmail} will be permanently removed.`
            : "This rental will be permanently removed."
        }
        loading={deletingRentalId === rentalToDelete?.id}
        onConfirm={() => void deleteRental()}
        onOpenChange={(open) => {
          if (!open && !deletingRentalId) setRentalToDelete(null);
        }}
        open={Boolean(rentalToDelete)}
        title="Delete rental?"
        tone="destructive"
      />
    </div>
  );
}

function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("en-GB", { day: "2-digit", month: "short", year: "numeric" }).format(date);
}

function getDaysUntil(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return Number.POSITIVE_INFINITY;
  const today = new Date();
  const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const target = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  return Math.ceil((target.getTime() - startOfToday.getTime()) / 86400000);
}

function MetricCard({
  icon: Icon,
  label,
  tone,
  value,
}: {
  icon: ComponentType<{ className?: string }>;
  label: string;
  tone: "primary" | "success" | "info" | "warning";
  value: string;
}) {
  const tones = {
    primary: "border-primary/20 bg-primary/5 text-primary",
    success: "border-[hsl(var(--status-success)/0.24)] bg-[hsl(var(--status-success)/0.08)] text-[hsl(var(--status-success))]",
    info: "border-[hsl(var(--status-info)/0.24)] bg-[hsl(var(--status-info)/0.08)] text-[hsl(var(--status-info))]",
    warning: "border-[hsl(var(--status-warning)/0.24)] bg-[hsl(var(--status-warning)/0.08)] text-[hsl(var(--status-warning))]",
  };

  return (
    <Card className={`rounded-2xl p-5 shadow-none ${tones[tone]}`}>
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-sm font-bold opacity-75">{label}</p>
          <strong className="mt-2 block text-3xl font-black">{value}</strong>
        </div>
        <Icon className="h-9 w-9 flex-shrink-0 opacity-45" />
      </div>
    </Card>
  );
}

function StatusBadge({ status }: { status: Rental["status"] }) {
  const config = {
    active: { icon: CheckCircle2, className: "border-[hsl(var(--status-success)/0.24)] bg-[hsl(var(--status-success)/0.08)] text-[hsl(var(--status-success))]" },
    upcoming: { icon: Clock, className: "border-[hsl(var(--status-info)/0.24)] bg-[hsl(var(--status-info)/0.08)] text-[hsl(var(--status-info))]" },
    expired: { icon: AlertCircle, className: "border-[hsl(var(--status-warning)/0.24)] bg-[hsl(var(--status-warning)/0.08)] text-[hsl(var(--status-warning))]" },
    cancelled: { icon: XCircle, className: "border-[hsl(var(--status-danger)/0.24)] bg-[hsl(var(--status-danger)/0.08)] text-[hsl(var(--status-danger))]" },
  }[status];
  const Icon = config.icon;

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-black ${config.className}`}>
      <Icon className="h-3.5 w-3.5" />
      {rentalStatusLabels[status]}
    </span>
  );
}

function EmptyRentals({ hasFilters }: { hasFilters: boolean }) {
  return (
    <div className="p-5">
      <div className="rounded-2xl border-2 border-dashed border-border bg-background p-10 text-center">
        <CalendarDays className="mx-auto mb-4 h-14 w-14 text-primary/35" />
        <h3 className="text-lg font-black text-foreground">{hasFilters ? "No rentals match these filters" : "No rental agreements yet"}</h3>
        <p className="mx-auto mt-2 max-w-xl text-sm font-semibold leading-6 text-muted-foreground">
          {hasFilters
            ? "Try another status or search term."
            : "Rental records will appear here with customer, product, date range, reminder, and lifecycle controls."}
        </p>
        {!hasFilters && (
          <div className="mt-5 flex flex-wrap justify-center gap-2">
            <Button asChildShim className="h-10 rounded-md px-4" variant="outline">
              <Link href="/rentalcalendar">
                <CalendarDays className="h-4 w-4" />
                Open calendar
              </Link>
            </Button>
            <Button asChildShim className="h-10 rounded-md px-4">
              <Link href="/CreateRental">
                <Plus className="h-4 w-4" />
                New rental
              </Link>
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
