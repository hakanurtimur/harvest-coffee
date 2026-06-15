"use client";

import MotionReveal from "@/components/MotionReveal";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { getHarvestApi } from "@/lib/harvest-api";
import type { Rental } from "@harvest/domain";
import { AlertTriangle, Calendar, CheckCircle, Clock, FileText, Plus } from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

export default function RentalsV2Workspace() {
  const api = useMemo(() => getHarvestApi(), []);
  const [rentals, setRentals] = useState<Rental[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  useEffect(() => {
    const loadRentals = async () => {
      const authenticated =
        new URL(window.location.href).searchParams.get("mockAuth") === "1" ||
        window.localStorage.getItem("harvest_mock_auth") === "logged-in";
      if (!authenticated) {
        window.location.href = "/home";
        return;
      }

      setIsCheckingAuth(false);
      setIsLoading(true);
      const user = await api.getCurrentUser();
      const nextRentals = user?.email ? await api.getRentals(user.email) : [];
      setRentals(nextRentals);
      setIsLoading(false);
    };

    void loadRentals();
  }, [api]);

  const activeRentals = rentals.filter((rental) => rental.status === "active").length;
  const upcomingRentals = rentals.filter((rental) => rental.status === "upcoming").length;

  if (isCheckingAuth) {
    return (
      <div className="harvest-theme bg-background px-5 py-32 text-center text-foreground">
        <p className="font-medium text-muted-foreground">Loading...</p>
      </div>
    );
  }

  return (
    <div className="harvest-theme overflow-hidden bg-background text-foreground">
      <section className="relative px-5 pb-12 pt-32 sm:px-8 lg:px-10">
        <CoffeeBranchAsset className="absolute -left-20 top-10 h-72 w-72 bg-primary/[0.09]" />
        <CoffeeBranchAsset className="absolute -right-16 top-8 h-72 w-72 -scale-x-100 bg-primary/[0.09]" />
        <div className="relative mx-auto flex max-w-7xl flex-col gap-7 lg:flex-row lg:items-end lg:justify-between">
          <MotionReveal>
            <p className="mb-5 text-xs font-black uppercase tracking-[0.34em] text-primary">Rental Agreements</p>
            <h1 className="font-display max-w-3xl text-5xl font-black leading-tight text-foreground sm:text-6xl">My Rentals</h1>
            <p className="mt-5 max-w-2xl text-lg font-medium leading-8 text-muted-foreground">
              Track your active and upcoming rental agreements
            </p>
          </MotionReveal>

          <MotionReveal delay={100} variant="right">
            <Button asChildShim className="h-12 rounded-md px-6">
              <Link href="/CreateRental">
                <Plus className="h-4 w-4" />
                Start New Rental
              </Link>
            </Button>
          </MotionReveal>
        </div>
      </section>

      <section className="relative bg-card px-5 py-10 sm:px-8 lg:px-10 lg:py-14">
        <CoffeeBranchAsset className="absolute -left-24 bottom-0 h-60 w-60 bg-primary/[0.07]" />
        <div className="relative mx-auto max-w-7xl">
          <div className="grid gap-4 md:grid-cols-3">
            <MetricCard label="Total Rentals" value={String(rentals.length)} tone="default" />
            <MetricCard label="Active" value={String(activeRentals)} tone="green" />
            <MetricCard label="Upcoming" value={String(upcomingRentals)} tone="blue" />
          </div>

          <div className="mt-8">
            {isLoading ? (
              <div className="rounded-lg bg-background/72 p-12 text-center">
                <p className="font-medium text-muted-foreground">Loading rentals...</p>
              </div>
            ) : rentals.length === 0 ? (
              <MotionReveal className="mx-auto max-w-2xl" variant="scale">
                <Card className="rounded-lg border-2 border-dashed border-primary/20 bg-background/72 p-10 text-center shadow-none sm:p-12">
                  <Calendar className="mx-auto mb-5 h-16 w-16 text-primary/35" />
                  <h2 className="font-display text-2xl font-black text-foreground">No active rentals</h2>
                  <p className="mt-3 text-base font-medium text-muted-foreground">Start renting our products today</p>
                  <Button asChildShim className="mt-6 h-11 rounded-md px-5">
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

function MetricCard({ label, tone, value }: { label: string; tone: "default" | "green" | "blue"; value: string }) {
  const styles = {
    default: "border-primary/15 bg-background/75 text-primary",
    green: "border-green-200 bg-green-50 text-green-800",
    blue: "border-blue-200 bg-blue-50 text-blue-800",
  }[tone];

  return (
    <Card className={`rounded-lg p-5 shadow-none ${styles}`}>
      <p className="text-sm font-black">{label}</p>
      <p className="font-display mt-2 text-4xl font-black">{value}</p>
    </Card>
  );
}

function RentalCard({ rental }: { rental: Rental }) {
  const StatusIcon = getStatusIcon(rental.status);

  return (
    <Card className="motion-card rounded-lg border-border bg-background/82 p-6 shadow-sm shadow-primary/5 hover:border-primary/20 hover:shadow-xl hover:shadow-primary/10">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex flex-1 gap-4">
          <div className={`grid h-12 w-12 flex-shrink-0 place-items-center rounded-lg ${getStatusIconColor(rental.status)}`}>
            <StatusIcon className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <h2 className="font-display text-2xl font-black text-foreground">{rental.productName}</h2>
            <div className="mt-4 grid gap-2 text-sm font-medium text-muted-foreground sm:grid-cols-2">
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
              <div className="mt-4 rounded-md bg-secondary p-3">
                <p className="text-xs font-semibold leading-5 text-foreground/78">{rental.notes}</p>
              </div>
            )}
          </div>
        </div>

        <div className="flex flex-row flex-wrap gap-2 lg:flex-col lg:items-end">
          <StatusBadge status={rental.status} />
          <button
            type="button"
            className="inline-flex h-10 items-center justify-center gap-2 rounded-md border border-border bg-background/70 px-3 text-sm font-bold text-foreground/75 transition-colors hover:bg-secondary hover:text-foreground"
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
    active: "bg-green-50 text-green-700",
    upcoming: "bg-blue-50 text-blue-700",
    expired: "bg-red-50 text-red-700",
    cancelled: "bg-secondary text-muted-foreground",
  };

  return colors[status] || "bg-secondary text-muted-foreground";
}

function getStatusPillColor(status: Rental["status"]) {
  if (status === "active") return "border-green-200 bg-green-50 text-green-800";
  if (status === "upcoming") return "border-blue-200 bg-blue-50 text-blue-800";
  if (status === "expired") return "border-red-200 bg-red-50 text-red-800";
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

function CoffeeBranchAsset({ className }: { className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={className}
      style={{
        display: "block",
        maskImage: "url('/assets/coffee-branch-clean.svg')",
        maskPosition: "center",
        maskRepeat: "no-repeat",
        maskSize: "contain",
        WebkitMaskImage: "url('/assets/coffee-branch-clean.svg')",
        WebkitMaskPosition: "center",
        WebkitMaskRepeat: "no-repeat",
        WebkitMaskSize: "contain",
      }}
    />
  );
}
