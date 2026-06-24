"use client";

import MotionReveal from "@/components/MotionReveal";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Combobox } from "@/components/ui/combobox";
import { DatePicker } from "@/components/ui/date-picker";
import { useCreateRentalMutation, useCurrentUserQuery, useProductsQuery } from "@/lib/harvest-query";
import type { Product } from "@/lib/domain";
import { AlertCircle, ArrowLeft, CalendarDays, CheckCircle, FileText } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

const fallbackEmail = "dealer@example.com";

export default function CreateRentalV2Workspace() {
  const productsQuery = useProductsQuery();
  const currentUserQuery = useCurrentUserQuery();
  const createRentalMutation = useCreateRentalMutation();
  const router = useRouter();
  const [productId, setProductId] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [notes, setNotes] = useState("");
  const [message, setMessage] = useState("");
  const products = productsQuery.data ?? [];
  const isSaving = createRentalMutation.isPending;

  const selectedProduct = products.find((product) => product.id === productId);
  const dateError = startDate && endDate && new Date(startDate) >= new Date(endDate) ? "End date must be after start date." : "";
  const duration =
    startDate && endDate && !dateError ? Math.ceil((new Date(endDate).getTime() - new Date(startDate).getTime()) / 86400000) : 0;

  const submitRental = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selectedProduct || !startDate || !endDate || dateError) return;
    setMessage("");
    try {
      const user = currentUserQuery.data ?? await currentUserQuery.refetch().then((result) => result.data);
      await createRentalMutation.mutateAsync({
        productId: selectedProduct.id,
        productName: selectedProduct.name,
        customerEmail: user?.email ?? fallbackEmail,
        customerName: user?.fullName || user?.email,
        startDate,
        endDate,
        notes,
      });
      router.push("/rentals");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Rental could not be created.");
    }
  };

  return (
    <div className="harvest-theme overflow-hidden bg-background text-foreground">
      <section className="relative px-5 pb-12 pt-32 sm:px-8 lg:px-10">
        <CoffeeBranchAsset className="absolute -left-20 top-10 h-72 w-72 bg-primary/[0.09]" />
        <CoffeeBranchAsset className="absolute -right-16 top-8 h-72 w-72 -scale-x-100 bg-primary/[0.09]" />
        <div className="relative mx-auto max-w-7xl">
          <MotionReveal>
            <Link className="mb-7 inline-flex items-center gap-2 text-sm font-black text-primary hover:text-primary/80" href="/rentals">
              <ArrowLeft className="h-4 w-4" />
              Back to rentals
            </Link>
            <p className="mb-5 text-xs font-black uppercase tracking-[0.34em] text-primary">Rental Agreement</p>
            <h1 className="font-display max-w-3xl text-5xl font-black leading-tight text-foreground sm:text-6xl">Create rental</h1>
            <p className="mt-5 max-w-2xl text-lg font-medium leading-8 text-muted-foreground">
              Select a product, choose your rental dates, and create the same rental agreement flow as the legacy screen.
            </p>
          </MotionReveal>
        </div>
      </section>

      <section className="relative bg-card px-5 py-10 sm:px-8 lg:px-10 lg:py-14">
        <CoffeeBranchAsset className="absolute -left-24 bottom-0 h-60 w-60 bg-primary/[0.07]" />
        <div className="relative mx-auto grid max-w-7xl gap-8 lg:grid-cols-[1.05fr_0.95fr] lg:items-start">
          <MotionReveal>
            <Card className="rounded-lg border-border bg-background/82 p-6 shadow-2xl shadow-primary/10 sm:p-8">
              <div className="mb-7 flex items-center justify-between gap-4">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.28em] text-primary">Rental agreement</p>
                  <h2 className="font-display mt-2 text-3xl font-black text-foreground">Create rental</h2>
                </div>
                <div className="grid h-12 w-12 place-items-center rounded-full bg-primary/10 text-primary">
                  <CalendarDays className="h-6 w-6" />
                </div>
              </div>

              {message && (
                <div className="mb-5 rounded-lg border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm font-semibold text-destructive">
                  {message}
                </div>
              )}

              <form className="space-y-5" onSubmit={submitRental}>
                <label className="block">
                  <span className="mb-2 block text-sm font-bold text-foreground/70">Product</span>
                  <Combobox
                    id="rental-product"
                    onChange={setProductId}
                    options={products.map((product) => ({
                      label: `${product.name} - GBP ${product.price.toFixed(2)}/month`,
                      value: product.id,
                    }))}
                    placeholder="Choose a product to rent"
                    searchPlaceholder="Search products..."
                    value={productId}
                  />
                </label>

                <div className="grid gap-5 sm:grid-cols-2">
                  <label className="block">
                    <span className="mb-2 block text-sm font-bold text-foreground/70">Start date</span>
                    <DatePicker
                      id="rental-start-date"
                      onChange={(value) => {
                        setStartDate(value);
                        if (endDate && new Date(value) >= new Date(endDate)) setEndDate("");
                      }}
                      placeholder="Select start date"
                      value={startDate}
                    />
                  </label>
                  <label className="block">
                    <span className="mb-2 block text-sm font-bold text-foreground/70">End date</span>
                    <DatePicker
                      fromDate={startDate ? addDays(parseDateValue(startDate), 1) : undefined}
                      id="rental-end-date"
                      onChange={setEndDate}
                      placeholder="Select end date"
                      value={endDate}
                    />
                  </label>
                </div>

                <label className="block">
                  <span className="mb-2 block text-sm font-bold text-foreground/70">Special notes</span>
                  <textarea
                    className={`${fieldClassName} min-h-28 py-3`}
                    value={notes}
                    onChange={(event) => setNotes(event.target.value)}
                    placeholder="Any special requirements or notes..."
                  />
                </label>

                {dateError && (
                  <div className="flex items-center gap-2 rounded-lg border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm font-semibold text-destructive">
                    <AlertCircle className="h-4 w-4" />
                    {dateError}
                  </div>
                )}

                {selectedProduct && duration > 0 && (
                  <div className="rounded-lg border border-primary/15 bg-secondary p-4">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                      <span className="text-sm font-bold text-foreground/75">Rental duration: {duration} days</span>
                      <strong className="font-display text-xl font-black text-primary">Monthly rate: GBP {selectedProduct.price.toFixed(2)}</strong>
                    </div>
                  </div>
                )}

                <Button
                  className="h-12 w-full rounded-md text-base font-black"
                  type="submit"
                  disabled={!selectedProduct || !startDate || !endDate || !!dateError || isSaving}
                >
                  {isSaving ? "Creating..." : "Create rental agreement"}
                </Button>
              </form>
            </Card>
          </MotionReveal>

          <MotionReveal delay={120} variant="right">
            <Card className="rounded-lg border-border bg-background/70 p-6 shadow-sm shadow-primary/5">
              <div className="grid h-14 w-14 place-items-center rounded-full bg-primary/10 text-primary">
                <FileText className="h-7 w-7" />
              </div>
              <h2 className="font-display mt-6 text-3xl font-black text-foreground">Rental summary</h2>
              <div className="mt-6 space-y-4 text-sm font-medium text-muted-foreground">
                <SummaryLine label="Selected product" value={selectedProduct?.name || "Not selected"} />
                <SummaryLine label="Start date" value={startDate || "Not selected"} />
                <SummaryLine label="End date" value={endDate || "Not selected"} />
                <SummaryLine label="Duration" value={duration > 0 ? `${duration} days` : "Waiting for dates"} />
              </div>
              <div className="mt-7 rounded-lg bg-secondary p-4">
                <div className="flex gap-3">
                  <CheckCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-primary" />
                  <p className="text-sm font-semibold leading-6 text-foreground/75">
                    This creates the same mock/API rental agreement and redirects back to Rentals.
                  </p>
                </div>
              </div>
            </Card>
          </MotionReveal>
        </div>
      </section>
    </div>
  );
}

const fieldClassName =
  "w-full rounded-md border border-border bg-background/70 px-3 py-2 text-sm font-medium text-foreground outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/10 placeholder:text-muted-foreground/65";

function SummaryLine({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-border/70 pb-3 last:border-b-0 last:pb-0">
      <span>{label}</span>
      <strong className="text-right text-foreground">{value}</strong>
    </div>
  );
}

function parseDateValue(value: string) {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, month - 1, day);
}

function addDays(date: Date, days: number) {
  const nextDate = new Date(date);
  nextDate.setDate(nextDate.getDate() + days);
  return nextDate;
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
