"use client";

import { getHarvestApi } from "@/lib/harvest-api";
import { useV2Enabled } from "@/lib/v2-pages";
import type { Order, OrderStatus, PaymentStatus } from "@harvest/domain";
import { ArrowLeft, Calendar, CheckCircle, Clock, MapPin, Package, Search, Truck, XCircle } from "lucide-react";
import Link from "next/link";
import { FormEvent, useEffect, useMemo, useState } from "react";
import TrackOrderV2Workspace from "./TrackOrderV2Workspace";

const statusSteps: OrderStatus[] = ["preparing", "in_transit", "delivered"];

export default function TrackOrderWorkspace() {
  const v2Enabled = useV2Enabled("/trackorder");
  const api = useMemo(() => getHarvestApi(), []);
  const [orderNumber, setOrderNumber] = useState("");
  const [searchOrderNumber, setSearchOrderNumber] = useState("");
  const [order, setOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (v2Enabled) return;

    const params = new URLSearchParams(window.location.search);
    const initialOrderNumber = params.get("order_number") || "";
    setOrderNumber(initialOrderNumber);
    setSearchOrderNumber(initialOrderNumber);
    if (initialOrderNumber) {
      void loadOrder(initialOrderNumber);
    }
  }, []);

  const loadOrder = async (nextOrderNumber: string) => {
    setIsLoading(true);
    const nextOrder = nextOrderNumber ? await api.getOrderByNumber(nextOrderNumber) : null;
    setOrder(nextOrder);
    setIsLoading(false);
  };

  const handleSearch = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSearchOrderNumber(orderNumber);
    await loadOrder(orderNumber);
  };

  if (v2Enabled) {
    return <TrackOrderV2Workspace />;
  }

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-amber-900 mb-3" style={{ fontFamily: "Georgia, serif" }}>
          Track Your Order
        </h1>
        <p className="text-amber-700">Enter your order number to track its status</p>
      </div>

      <section className="max-w-2xl mx-auto rounded-xl border border-amber-200 bg-white">
        <div className="p-6">
          <form className="space-y-4" onSubmit={handleSearch}>
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">Order Number</label>
              <div className="flex gap-2">
                <input
                  className="flex-1 rounded-md border border-gray-200 bg-white px-3 py-2 text-gray-900"
                  value={orderNumber}
                  onChange={(event) => setOrderNumber(event.target.value)}
                  placeholder="e.g., HC12345678"
                />
                <button className="inline-flex items-center rounded-md bg-amber-900 px-4 py-2 font-medium text-white hover:bg-amber-800" type="submit">
                  <Search className="w-4 h-4 mr-2" />
                  Track
                </button>
              </div>
            </div>
          </form>
        </div>
      </section>

      {isLoading && (
        <div className="max-w-4xl mx-auto">
          <div className="h-96 bg-gray-100 animate-pulse rounded-lg" />
        </div>
      )}

      {!isLoading && searchOrderNumber && !order && (
        <section className="max-w-2xl mx-auto rounded-xl border-2 border-dashed border-amber-200 bg-white">
          <div className="p-12 text-center">
            <Package className="w-16 h-16 text-amber-300 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-amber-900 mb-2">Order Not Found</h2>
            <p className="text-gray-600 mb-6">
              We couldn&apos;t find an order with number: <strong>{searchOrderNumber}</strong>
            </p>
            <p className="text-sm text-gray-500">Please check your order number and try again.</p>
          </div>
        </section>
      )}

      {!isLoading && order && (
        <section className="max-w-4xl mx-auto space-y-6">
          <article className="rounded-xl border border-amber-100 bg-gradient-to-r from-amber-50 to-orange-50">
            <header className="p-6">
              <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                <div>
                  <h2 className="text-3xl text-amber-900 mb-3 font-semibold" style={{ fontFamily: "Georgia, serif" }}>
                    Order #{order.orderNumber}
                  </h2>
                  <div className="space-y-1 text-sm text-gray-600">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      <span>Ordered: {formatLongDate(order.createdAt)}</span>
                    </div>
                    {order.estimatedDeliveryDate && (
                      <div className="flex items-center gap-2">
                        <Truck className="w-4 h-4" />
                        <span>Est. Delivery: {formatLongDate(order.estimatedDeliveryDate)}</span>
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <OrderStatusBadge status={order.status} />
                  <PaymentStatusBadge status={order.paymentStatus} />
                </div>
              </div>
            </header>
          </article>

          <article className="rounded-xl border border-amber-100 bg-white">
            <header className="border-b border-amber-100 px-6 py-4">
              <h2 className="text-xl font-semibold text-amber-900">Delivery Status</h2>
            </header>
            <div className="p-6">
              <div className="mb-8">
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-gradient-to-r from-blue-600 via-orange-600 to-green-600 h-2 rounded-full transition-all duration-500"
                    style={{ width: `${getStatusProgress(order.status)}%` }}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <StatusStep status="preparing" currentStatus={order.status} title="Preparing" description="Your order is being prepared" activeClass="text-blue-900" />
                <StatusStep status="in_transit" currentStatus={order.status} title="In Transit" description="On the way to you" activeClass="text-orange-900" trackingNumber={order.trackingNumber} />
                <StatusStep status="delivered" currentStatus={order.status} title="Delivered" description="Order completed" activeClass="text-green-900" />
              </div>
            </div>
          </article>

          {order.deliveryAddress && (
            <article className="rounded-xl border border-amber-100 bg-white">
              <header className="border-b border-amber-100 px-6 py-4">
                <h2 className="flex items-center gap-2 text-xl font-semibold text-amber-900">
                  <MapPin className="w-5 h-5" />
                  Delivery Address
                </h2>
              </header>
              <div className="p-6">
                <p className="text-gray-700 whitespace-pre-line">{order.deliveryAddress}</p>
              </div>
            </article>
          )}

          <article className="rounded-xl border border-amber-100 bg-white">
            <header className="border-b border-amber-100 px-6 py-4">
              <h2 className="text-xl font-semibold text-amber-900">Order Items</h2>
            </header>
            <div className="p-6">
              <div className="space-y-3">
                {order.items?.map((item, index) => (
                  <div className="flex justify-between items-center py-3 border-b border-amber-50 last:border-0" key={`${item.productId}-${index}`}>
                    <div>
                      <p className="font-semibold text-amber-900">{item.productName}</p>
                      <p className="text-sm text-gray-600">Qty: {item.quantity}</p>
                    </div>
                    <p className="font-bold text-amber-900">£{item.subtotal.toFixed(2)}</p>
                  </div>
                ))}
              </div>
              <div className="mt-6 pt-4 border-t-2 border-amber-200">
                <div className="flex justify-between items-center">
                  <span className="text-xl font-semibold text-amber-900">Total</span>
                  <span className="text-2xl font-bold text-amber-900">£{order.totalAmount.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </article>

          <div className="text-center">
            <Link href="/orders" className="inline-flex items-center rounded-md border border-amber-900 px-4 py-2 font-medium text-amber-900 hover:bg-amber-50">
              <ArrowLeft className="w-4 h-4 mr-2" />
              View All Orders
            </Link>
          </div>
        </section>
      )}
    </div>
  );
}

function StatusStep({
  status,
  currentStatus,
  title,
  description,
  activeClass,
  trackingNumber,
}: {
  status: OrderStatus;
  currentStatus: OrderStatus;
  title: string;
  description: string;
  activeClass: string;
  trackingNumber?: string;
}) {
  const active = status === currentStatus;
  return (
    <div className="text-center">
      <div className="flex justify-center mb-3">{getStatusIcon(status, currentStatus)}</div>
      <h3 className={`font-semibold mb-1 ${active ? activeClass : "text-gray-600"}`}>{title}</h3>
      <p className="text-xs text-gray-500">{description}</p>
      {trackingNumber && status === "in_transit" && active && (
        <p className="text-xs text-amber-900 font-medium mt-1">Tracking: {trackingNumber}</p>
      )}
    </div>
  );
}

function OrderStatusBadge({ status }: { status: OrderStatus }) {
  const config = {
    preparing: { label: "Preparing", icon: Package, className: "bg-blue-100 text-blue-800 border-blue-200" },
    in_transit: { label: "In Transit", icon: Truck, className: "bg-orange-100 text-orange-800 border-orange-200" },
    delivered: { label: "Delivered", icon: CheckCircle, className: "bg-green-100 text-green-800 border-green-200" },
    cancelled: { label: "Cancelled", icon: XCircle, className: "bg-red-100 text-red-800 border-red-200" },
  }[status];
  const Icon = config.icon;
  return (
    <span className={`${config.className} border inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm`}>
      <Icon className="w-4 h-4" />
      <span className="font-medium">{config.label}</span>
    </span>
  );
}

function PaymentStatusBadge({ status }: { status: PaymentStatus }) {
  const config = {
    pending: { label: "Pending", icon: Clock, className: "bg-yellow-100 text-yellow-800 border-yellow-200" },
    paid: { label: "Paid", icon: CheckCircle, className: "bg-green-100 text-green-800 border-green-200" },
    failed: { label: "Failed", icon: XCircle, className: "bg-red-100 text-red-800 border-red-200" },
  }[status];
  const Icon = config.icon;
  return (
    <span className={`${config.className} border inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm`}>
      <Icon className="w-4 h-4" />
      <span className="font-medium">{config.label}</span>
    </span>
  );
}

function getStatusProgress(status: OrderStatus) {
  const index = statusSteps.indexOf(status);
  return index < 0 ? 0 : ((index + 1) / statusSteps.length) * 100;
}

function getStatusIcon(status: OrderStatus, currentStatus: OrderStatus) {
  const currentIndex = statusSteps.indexOf(currentStatus);
  const statusIndex = statusSteps.indexOf(status);

  if (statusIndex < currentIndex) return <CheckCircle className="w-8 h-8 text-green-600" />;
  if (statusIndex === currentIndex) {
    if (status === "preparing") return <Package className="w-8 h-8 text-blue-600" />;
    if (status === "in_transit") return <Truck className="w-8 h-8 text-orange-600" />;
    if (status === "delivered") return <CheckCircle className="w-8 h-8 text-green-600" />;
  }

  return <div className="w-8 h-8 rounded-full border-2 border-gray-300" />;
}

function formatLongDate(value: string) {
  return new Intl.DateTimeFormat("en-GB", { day: "2-digit", month: "long", year: "numeric" }).format(new Date(value));
}
