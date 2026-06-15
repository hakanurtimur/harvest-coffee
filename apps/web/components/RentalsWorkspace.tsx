"use client";

import { getHarvestApi } from "@/lib/harvest-api";
import { useV2Enabled } from "@/lib/v2-pages";
import { Rental } from "@harvest/domain";
import { AlertTriangle, Calendar, CheckCircle, Clock, FileText } from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import RentalsV2Workspace from "./RentalsV2Workspace";

export default function RentalsWorkspace() {
  const v2Enabled = useV2Enabled("/rentals");
  const api = useMemo(() => getHarvestApi(), []);
  const [rentals, setRentals] = useState<Rental[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  useEffect(() => {
    if (v2Enabled) return;

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
  }, [api, v2Enabled]);

  if (v2Enabled) {
    return <RentalsV2Workspace />;
  }

  if (isCheckingAuth) {
    return <div className="text-center py-12">Loading...</div>;
  }

  const activeRentals = rentals.filter((rental) => rental.status === "active").length;
  const upcomingRentals = rentals.filter((rental) => rental.status === "upcoming").length;

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-amber-900 mb-2" style={{ fontFamily: "Georgia, serif" }}>
            My Rentals
          </h1>
          <p className="text-amber-700">Track your active and upcoming rental agreements</p>
        </div>
        <Link
          href="/CreateRental"
          className="inline-flex items-center justify-center rounded-md bg-amber-900 hover:bg-amber-800 text-white px-4 py-2 font-semibold transition-colors"
        >
          Start New Rental
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <section className="border border-amber-100 bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl">
          <div className="p-4">
            <p className="text-sm text-amber-700 mb-1">Total Rentals</p>
            <p className="text-3xl font-bold text-amber-900">{rentals.length}</p>
          </div>
        </section>

        <section className="border border-green-200 bg-green-50 rounded-xl">
          <div className="p-4">
            <p className="text-sm text-green-700 mb-1">Active</p>
            <p className="text-3xl font-bold text-green-900">{activeRentals}</p>
          </div>
        </section>

        <section className="border border-blue-200 bg-blue-50 rounded-xl">
          <div className="p-4">
            <p className="text-sm text-blue-700 mb-1">Upcoming</p>
            <p className="text-3xl font-bold text-blue-900">{upcomingRentals}</p>
          </div>
        </section>
      </div>

      {isLoading ? (
        <div className="text-center py-12">Loading rentals...</div>
      ) : rentals.length === 0 ? (
        <section className="border-2 border-dashed border-amber-200 rounded-xl bg-white">
          <div className="p-12 text-center">
            <Calendar className="w-16 h-16 text-amber-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-amber-900 mb-2">No active rentals</h3>
            <p className="text-gray-600 mb-4">Start renting our products today</p>
            <Link
              href="/CreateRental"
              className="inline-flex items-center justify-center rounded-md bg-amber-900 hover:bg-amber-800 text-white px-4 py-2 font-semibold transition-colors"
            >
              Create First Rental
            </Link>
          </div>
        </section>
      ) : (
        <div className="space-y-4">
          {rentals.map((rental) => {
            const StatusIcon = getStatusIcon(rental.status);
            const statusColor = getStatusColor(rental.status);

            return (
              <article key={rental.id} className="hover:shadow-lg transition-all border border-amber-100 bg-white rounded-xl">
                <div className="p-6">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <div className={`p-2 rounded-lg ${statusColor}`}>
                          <StatusIcon className="w-5 h-5" />
                        </div>
                        <h3 className="text-lg font-semibold text-amber-900">{rental.productName}</h3>
                      </div>
                      <div className="space-y-2 text-sm text-gray-600">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4" />
                          Start: {formatRentalDate(rental.startDate)}
                        </div>
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4" />
                          End: {formatRentalDate(rental.endDate)}
                        </div>
                        {rental.notes && (
                          <div className="mt-2 p-2 bg-amber-50 rounded">
                            <p className="text-xs text-amber-900">{rental.notes}</p>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-col gap-2">
                      <div className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusPillColor(rental.status)}`}>
                        {capitalize(rental.status)}
                      </div>
                      <button
                        type="button"
                        className="inline-flex items-center justify-center gap-2 rounded-md border border-gray-300 px-3 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
                      >
                        <FileText className="w-4 h-4" />
                        Invoice
                      </button>
                    </div>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
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

function getStatusColor(status: Rental["status"]) {
  const colors = {
    active: "text-green-600 bg-green-50",
    upcoming: "text-blue-600 bg-blue-50",
    expired: "text-red-600 bg-red-50",
    cancelled: "text-gray-600 bg-gray-50",
  };

  return colors[status] || "text-gray-600 bg-gray-50";
}

function getStatusPillColor(status: Rental["status"]) {
  if (status === "active") return "bg-green-100 text-green-800";
  if (status === "upcoming") return "bg-blue-100 text-blue-800";
  if (status === "expired") return "bg-red-100 text-red-800";
  return "bg-gray-100 text-gray-800";
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
