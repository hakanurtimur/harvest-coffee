"use client";

import { getHarvestApi } from "@/lib/harvest-api";
import { Rental } from "@/lib/domain";
import { Plus, RefreshCw, Trash2 } from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

const rentalStatusLabels: Record<Rental["status"], string> = {
  active: "Active",
  upcoming: "Upcoming",
  expired: "Expired",
  cancelled: "Cancelled",
};

export default function AdminRentalsWorkspace() {
  const api = useMemo(() => getHarvestApi(), []);
  const [rentals, setRentals] = useState<Rental[]>([]);
  const [statusFilter, setStatusFilter] = useState<Rental["status"] | "all">("all");
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    void loadRentals();
  }, []);

  const loadRentals = async () => {
    setIsLoading(true);
    setMessage("");
    setRentals(await api.getRentals());
    setIsLoading(false);
  };

  const updateRentalStatus = async (id: string, status: Rental["status"]) => {
    setMessage("");
    try {
      const updated = await api.updateRental(id, { status });
      setRentals((current) => current.map((rental) => (rental.id === id ? updated : rental)));
      setMessage(`${updated.productName} updated.`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Rental could not be updated.");
    }
  };

  const deleteRental = async (id: string) => {
    setMessage("");
    try {
      await api.deleteRental(id);
      setRentals((current) => current.filter((rental) => rental.id !== id));
      setMessage("Rental deleted.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Rental could not be deleted.");
    }
  };

  const filteredRentals = rentals.filter((rental) => statusFilter === "all" || rental.status === statusFilter);
  const activeCount = rentals.filter((rental) => rental.status === "active").length;
  const expiredCount = rentals.filter((rental) => rental.status === "expired").length;

  return (
    <>
      <header className="topbar">
        <div>
          <p>Admin</p>
          <h1>Rental management</h1>
        </div>
        <div className="topbar-actions">
          <button className="ghost-button" onClick={loadRentals} disabled={isLoading}>
            <RefreshCw size={16} />
            Refresh
          </button>
          <Link className="primary-link" href="/rentals/new">
            <Plus size={16} />
            New rental
          </Link>
        </div>
      </header>

      {message && <section className={message.includes("could not") || message.includes("disabled") ? "notice error" : "notice"}>{message}</section>}

      <section className="metrics">
        <div>
          <span>Total rentals</span>
          <strong>{rentals.length}</strong>
        </div>
        <div>
          <span>Active rentals</span>
          <strong>{activeCount}</strong>
        </div>
        <div>
          <span>Expired rentals</span>
          <strong>{expiredCount}</strong>
        </div>
      </section>

      <section className="orders-section">
        <div className="section-head">
          <div>
            <p>Agreements</p>
            <h2>All rentals</h2>
          </div>
          <label className="compact-filter">
            <span>Status</span>
            <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as Rental["status"] | "all")}>
              <option value="all">All statuses</option>
              {Object.entries(rentalStatusLabels).map(([value, label]) => (
                <option value={value} key={value}>{label}</option>
              ))}
            </select>
          </label>
        </div>

        {isLoading ? (
          <div className="loading-panel">Loading rentals...</div>
        ) : filteredRentals.length === 0 ? (
          <div className="loading-panel">No rentals found.</div>
        ) : (
          <div className="admin-rental-list">
            {filteredRentals.map((rental) => (
              <article className="admin-rental-card" key={rental.id}>
                <div>
                  <h3>{rental.productName}</h3>
                  <p>{rental.customerName || rental.customerEmail} ({rental.customerEmail})</p>
                  <span>{formatDate(rental.startDate)} - {formatDate(rental.endDate)}</span>
                </div>
                <span className={`rental-status ${rental.status}`}>{rentalStatusLabels[rental.status]}</span>
                <select value={rental.status} onChange={(event) => updateRentalStatus(rental.id, event.target.value as Rental["status"])}>
                  {Object.entries(rentalStatusLabels).map(([value, label]) => (
                    <option value={value} key={value}>{label}</option>
                  ))}
                </select>
                <button className="icon-button danger" onClick={() => deleteRental(rental.id)} aria-label={`Delete ${rental.productName}`}>
                  <Trash2 size={16} />
                </button>
              </article>
            ))}
          </div>
        )}
      </section>
    </>
  );
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-GB", { day: "2-digit", month: "short", year: "numeric" }).format(new Date(value));
}
