"use client";

import { DatePicker } from "@/components/ui/date-picker";
import { Combobox } from "@/components/ui/combobox";
import { getHarvestApi } from "@/lib/harvest-api";
import { useV2Enabled } from "@/lib/v2-pages";
import { Product } from "@/lib/domain";
import { AlertCircle, ArrowLeft, CalendarDays } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useMemo, useState } from "react";
import CreateRentalV2Workspace from "./CreateRentalV2Workspace";

const fallbackEmail = "dealer@example.com";

export default function CreateRentalWorkspace() {
  const v2Enabled = useV2Enabled("/CreateRental");
  const api = useMemo(() => getHarvestApi(), []);
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [productId, setProductId] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [notes, setNotes] = useState("");
  const [message, setMessage] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (v2Enabled) return;

    void api.getProducts().then(setProducts);
  }, [api, v2Enabled]);

  const selectedProduct = products.find((product) => product.id === productId);
  const dateError = startDate && endDate && new Date(startDate) >= new Date(endDate) ? "End date must be after start date." : "";
  const duration = startDate && endDate && !dateError ? Math.ceil((new Date(endDate).getTime() - new Date(startDate).getTime()) / 86400000) : 0;

  const submitRental = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selectedProduct || !startDate || !endDate || dateError) return;
    setIsSaving(true);
    setMessage("");
    try {
      const user = await api.getCurrentUser();
      await api.createRental({
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
    } finally {
      setIsSaving(false);
    }
  };

  if (v2Enabled) {
    return <CreateRentalV2Workspace />;
  }

  return (
    <>
      <div className="detail-actions">
        <Link href="/rentals" className="ghost-link">
          <ArrowLeft size={16} />
          Back to rentals
        </Link>
      </div>

      <section className="form-shell">
        <div className="section-head compact">
          <div>
            <p>Rental agreement</p>
            <h1>Create rental</h1>
          </div>
          <CalendarDays size={28} />
        </div>

        {message && <div className="notice error">{message}</div>}

        <form className="rental-form" onSubmit={submitRental}>
          <label>
            <span>Product</span>
            <Combobox
              id="legacy-rental-product"
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

          <div className="form-row">
            <label>
              <span>Start date</span>
              <DatePicker
                id="legacy-rental-start-date"
                onChange={(value) => {
                  setStartDate(value);
                  if (endDate && new Date(value) >= new Date(endDate)) setEndDate("");
                }}
                placeholder="Select start date"
                value={startDate}
              />
            </label>
            <label>
              <span>End date</span>
              <DatePicker
                fromDate={startDate ? addDays(parseDateValue(startDate), 1) : undefined}
                id="legacy-rental-end-date"
                onChange={setEndDate}
                placeholder="Select end date"
                value={endDate}
              />
            </label>
          </div>

          <label>
            <span>Special notes</span>
            <textarea value={notes} onChange={(event) => setNotes(event.target.value)} placeholder="Any special requirements or notes..." />
          </label>

          {dateError && (
            <div className="notice error">
              <AlertCircle size={16} />
              {dateError}
            </div>
          )}

          {selectedProduct && duration > 0 && (
            <div className="rental-summary">
              <span>Rental duration: {duration} days</span>
              <strong>Monthly rate: GBP {selectedProduct.price.toFixed(2)}</strong>
            </div>
          )}

          <button className="primary-button" type="submit" disabled={!selectedProduct || !startDate || !endDate || !!dateError || isSaving}>
            {isSaving ? "Creating..." : "Create rental agreement"}
          </button>
        </form>
      </section>
    </>
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
