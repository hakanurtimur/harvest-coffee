"use client";

import MotionReveal from "@/components/MotionReveal";
import LoadingState from "@/components/LoadingState";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useMyRentalsQuery } from "@/lib/harvest-query";
import type { Rental } from "@/lib/domain";
import { AlertTriangle, Calendar, CheckCircle, Clock, FileText, Plus } from "lucide-react";
import Link from "next/link";

export default function RentalsModernWorkspace() {
  const rentalsQuery = useMyRentalsQuery();
  const rentals = rentalsQuery.data ?? [];
  const isLoading = rentalsQuery.isLoading;

  const activeRentals = rentals.filter((rental) => rental.status === "active").length;
  const upcomingRentals = rentals.filter((rental) => rental.status === "upcoming").length;

  return (
    <div className="harvest-theme overflow-hidden bg-background text-foreground">
      <section className="relative px-5 pb-6 pt-0 sm:px-8 lg:px-10">
        <MotionReveal className="relative mx-auto max-w-7xl">
          <Card className="overflow-hidden rounded-2xl border-border bg-card p-5 shadow-sm shadow-primary/5 sm:p-6">
            <div className="relative flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
              <div className="relative">
                <p className="text-[10px] font-black uppercase tracking-[0.28em] text-primary">Dealer rentals</p>
                <h1 className="mt-2 text-3xl font-black tracking-normal text-foreground sm:text-4xl">My Rentals</h1>
                <p className="mt-2 max-w-2xl text-sm font-semibold leading-6 text-muted-foreground">
                  Track active agreements, upcoming dates, notes, and rental paperwork from your dealer workspace.
                </p>
              </div>
              <div className="relative flex flex-col gap-3 lg:min-w-[520px]">
                <div className="grid gap-3 sm:grid-cols-3">
                  <MetricCard label="Total" value={String(rentals.length)} tone="default" />
                  <MetricCard label="Active" value={String(activeRentals)} tone="success" />
                  <MetricCard label="Upcoming" value={String(upcomingRentals)} tone="info" />
                </div>
                <Button asChildShim className="h-10 self-start rounded-xl px-4 text-sm lg:self-end">
                  <Link href="/CreateRental">
                    <Plus className="h-4 w-4" />
                    Start New Rental
                  </Link>
                </Button>
              </div>
            </div>
          </Card>
        </MotionReveal>
      </section>

      <section className="relative bg-background px-5 py-6 sm:px-8 lg:px-10 lg:py-8">
        <div className="relative mx-auto max-w-7xl">
          <div>
            {isLoading ? (
              <LoadingState
                description="Fetching active agreements and upcoming rental dates."
                minHeight="min-h-[260px]"
                title="Loading rentals"
              />
            ) : rentals.length === 0 ? (
              <MotionReveal className="mx-auto max-w-2xl" variant="scale">
                <Card className="rounded-2xl border-2 border-dashed border-border bg-card p-10 text-center shadow-none sm:p-12">
                  <Calendar className="mx-auto mb-5 h-14 w-14 text-primary/35" />
                  <h2 className="text-2xl font-black tracking-normal text-foreground">No active rentals</h2>
                  <p className="mt-3 text-base font-medium text-muted-foreground">Start renting our products today</p>
                  <Button asChildShim className="mt-6 h-10 rounded-xl px-4 text-sm">
                    <Link href="/CreateRental">
                      Create First Rental
                      <Plus className="h-4 w-4" />
                    </Link>
                  </Button>
                </Card>
              </MotionReveal>
            ) : (
              <div className="space-y-5">
                {rentals.map((rental, index) => (
                  <MotionReveal delay={index * 70} key={rental.id}>
                    <RentalCard rental={rental} />
                  </MotionReveal>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}

function MetricCard({ label, tone, value }: { label: string; tone: "default" | "success" | "info"; value: string }) {
  const styles = {
    default: "border-border bg-card text-foreground",
    success: "border-[hsl(var(--status-success)/0.24)] bg-[hsl(var(--status-success)/0.08)] text-[hsl(var(--status-success))]",
    info: "border-[hsl(var(--status-info)/0.24)] bg-[hsl(var(--status-info)/0.08)] text-[hsl(var(--status-info))]",
  }[tone];

  return (
    <Card className={`rounded-2xl p-5 shadow-none ${styles}`}>
      <p className="text-xs font-black uppercase tracking-[0.12em] opacity-75">{label}</p>
      <p className="mt-3 text-3xl font-black tracking-normal">{value}</p>
    </Card>
  );
}

function RentalCard({ rental }: { rental: Rental }) {
  const StatusIcon = getStatusIcon(rental.status);

  return (
    <Card className="motion-card rounded-2xl border-border bg-card p-5 shadow-sm shadow-primary/5 transition-colors hover:border-primary/20 sm:p-6">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex flex-1 gap-4">
          <div className={`grid h-11 w-11 flex-shrink-0 place-items-center rounded-xl ${getStatusIconColor(rental.status)}`}>
            <StatusIcon className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <h2 className="text-xl font-black tracking-normal text-foreground sm:text-2xl">{rental.productName}</h2>
            <div className="mt-4 grid gap-2 text-sm font-semibold text-muted-foreground sm:grid-cols-2">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-primary" />
                Start: {formatRentalDate(rental.startDate)}
              </div>
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-primary" />
                End: {formatRentalDate(rental.endDate)}
              </div>
            </div>
            {rental.notes && (
              <div className="mt-4 rounded-xl border border-border bg-secondary/70 p-3">
                <p className="text-xs font-semibold leading-5 text-foreground/78">{rental.notes}</p>
              </div>
            )}
          </div>
        </div>

        <div className="flex flex-row flex-wrap gap-2 lg:flex-col lg:items-end">
          <StatusBadge status={rental.status} />
          <button
            type="button"
            className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-border bg-background/70 px-3 text-sm font-bold text-foreground/75 transition-colors hover:bg-secondary hover:text-foreground"
          >
            <FileText className="h-4 w-4" />
            Invoice
          </button>
        </div>
      </div>
    </Card>
  );
}

function StatusBadge({ status }: { status: Rental["status"] }) {
  return <Badge className={getStatusPillColor(status)}>{capitalize(status)}</Badge>;
}

function getStatusIcon(status: Rental["status"]) {
  const icons = {
    active: CheckCircle,
    upcoming: Clock,
    expired: AlertTriangle,
    cancelled: AlertTriangle,
  };

  return icons[status] || Calendar;
}

function getStatusIconColor(status: Rental["status"]) {
  const colors = {
    active: "bg-[hsl(var(--status-success)/0.1)] text-[hsl(var(--status-success))]",
    upcoming: "bg-[hsl(var(--status-info)/0.1)] text-[hsl(var(--status-info))]",
    expired: "bg-[hsl(var(--status-danger)/0.1)] text-[hsl(var(--status-danger))]",
    cancelled: "bg-secondary text-muted-foreground",
  };

  return colors[status] || "bg-secondary text-muted-foreground";
}

function getStatusPillColor(status: Rental["status"]) {
  if (status === "active") return "border-[hsl(var(--status-success)/0.24)] bg-[hsl(var(--status-success)/0.08)] text-[hsl(var(--status-success))]";
  if (status === "upcoming") return "border-[hsl(var(--status-info)/0.24)] bg-[hsl(var(--status-info)/0.08)] text-[hsl(var(--status-info))]";
  if (status === "expired") return "border-[hsl(var(--status-danger)/0.2)] bg-[hsl(var(--status-danger)/0.08)] text-[hsl(var(--status-danger))]";
  return "border-border bg-secondary text-secondary-foreground";
}

function formatRentalDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

function capitalize(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}
