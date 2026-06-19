"use client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { getHarvestApi } from "@/lib/harvest-api";
import type { Order, OrderStatus, PaymentStatus } from "@/lib/domain";
import { orderStatusLabels, paymentStatusLabels } from "@/lib/domain";
import { ArrowRight, Calendar, CheckCircle, Clock, Filter, Package, RefreshCw, Save, Truck, User, XCircle } from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

const orderStatusOptions: OrderStatus[] = ["preparing", "in_transit", "delivered"];
const paymentStatusOptions: PaymentStatus[] = ["pending", "paid", "failed"];
type StatusFilter = "all" | OrderStatus;
type PaymentFilter = "all" | PaymentStatus;

export default function AdminOrdersV2Workspace() {
  const api = useMemo(() => getHarvestApi(), []);
  const [orders, setOrders] = useState<Order[]>([]);
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [savingOrderId, setSavingOrderId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [paymentFilter, setPaymentFilter] = useState<PaymentFilter>("all");

  const loadOrders = async () => {
    setIsLoading(true);
    setMessage("");
    const nextOrders = await api.getOrders();
    setOrders([...nextOrders].sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt)));
    setIsLoading(false);
  };

  useEffect(() => {
    void loadOrders();
  }, []);

  const updateOrder = async (id: string, input: Partial<Pick<Order, "status" | "paymentStatus" | "trackingNumber" | "estimatedDeliveryDate">>) => {
    setSavingOrderId(id);
    setMessage("");
    try {
      const updated = await api.updateOrder(id, input);
      setOrders((current) => current.map((order) => order.id === id ? updated : order));
      setMessage(`Order #${updated.orderNumber} updated.`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Order could not be updated.");
    } finally {
      setSavingOrderId(null);
    }
  };

  const openOrders = orders.filter((order) => order.status !== "delivered").length;
  const pendingPayments = orders.filter((order) => order.paymentStatus === "pending").length;
  const revenue = orders.reduce((sum, order) => sum + order.totalAmount, 0);
  const filteredOrders = orders.filter((order) => {
    const statusMatches = statusFilter === "all" || order.status === statusFilter;
    const paymentMatches = paymentFilter === "all" || order.paymentStatus === paymentFilter;
    return statusMatches && paymentMatches;
  });

  return (
    <div className="space-y-5 text-[#3a2619]">
      <section className="rounded-lg border border-[#e8daca] bg-[#fffdf8] p-5 shadow-sm shadow-[#8a461c]/5 md:p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 className="text-3xl font-black tracking-normal text-[#3a2619] md:text-4xl">Orders</h1>
            <p className="mt-2 text-sm font-semibold text-[#8f7461]">Manage order queue</p>
          </div>
          <Button className="h-10 rounded-md px-4" disabled={isLoading} onClick={loadOrders}>
            <RefreshCw className="h-4 w-4" />
            Refresh
          </Button>
        </div>
      </section>

      {message && (
        <div
          className={`rounded-lg border px-4 py-3 text-sm font-bold ${
            message.includes("disabled") || message.includes("could not")
              ? "border-red-200 bg-red-50 text-red-800"
              : "border-green-200 bg-green-50 text-green-800"
          }`}
        >
          {message}
        </div>
      )}

      <section className="grid gap-4 md:grid-cols-3">
        <MetricCard label="Total orders" value={String(orders.length)} />
        <MetricCard label="Open orders" value={String(openOrders)} />
        <MetricCard label="Pending payments" value={String(pendingPayments)} />
      </section>

      <Card className="rounded-lg border-[#e8daca] bg-[#fffdf8] p-4 shadow-sm shadow-[#8a461c]/5">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
          <div className="flex items-center gap-2 text-sm font-black text-[#5c3a25]">
            <Filter className="h-4 w-4 text-[#9a5728]" />
            Filters:
          </div>
          <select
            className="h-10 rounded-md border border-[#e3d1bd] bg-white px-3 text-sm font-bold text-[#3a2619] outline-none focus:border-[#8a461c]"
            onChange={(event) => setStatusFilter(event.target.value as StatusFilter)}
            value={statusFilter}
          >
            <option value="all">All statuses</option>
            {orderStatusOptions.map((status) => (
              <option key={status} value={status}>{orderStatusLabels[status]}</option>
            ))}
          </select>
          <select
            className="h-10 rounded-md border border-[#e3d1bd] bg-white px-3 text-sm font-bold text-[#3a2619] outline-none focus:border-[#8a461c]"
            onChange={(event) => setPaymentFilter(event.target.value as PaymentFilter)}
            value={paymentFilter}
          >
            <option value="all">All payments</option>
            {paymentStatusOptions.map((status) => (
              <option key={status} value={status}>{paymentStatusLabels[status]}</option>
            ))}
          </select>
          <p className="text-sm font-semibold text-[#8f7461] lg:ml-auto">
            <span className="font-black text-[#7c3514]">{filteredOrders.length}</span> orders
          </p>
        </div>
      </Card>

      <section className="rounded-lg border border-[#e8daca] bg-[#fffdf8] shadow-sm shadow-[#8a461c]/5">
        <header className="flex flex-col gap-3 border-b border-[#eadccf] px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.18em] text-[#9a5728]">Operations</p>
            <h2 className="mt-1 text-xl font-black text-[#3a2619]">Manage order queue</h2>
          </div>
          <strong className="text-lg font-black text-[#7c3514]">GBP {revenue.toFixed(2)}</strong>
        </header>

        <div className="grid gap-4 p-5">
          {isLoading ? (
            <div className="grid gap-3">
              {[0, 1, 2].map((item) => (
                <div className="h-40 animate-pulse rounded-lg bg-[#f3e8da]" key={item} />
              ))}
            </div>
          ) : filteredOrders.length === 0 ? (
            <div className="rounded-lg border-2 border-dashed border-[#e0cdb9] p-10 text-center">
              <Package className="mx-auto mb-4 h-14 w-14 text-[#cda66d]" />
              <h3 className="text-lg font-black text-[#3a2619]">No orders found</h3>
              <p className="mt-1 text-sm font-semibold text-[#8f7461]">No orders match the selected filters.</p>
            </div>
          ) : (
            filteredOrders.map((order) => (
              <OrderCard key={order.id} order={order} saving={savingOrderId === order.id} updateOrder={updateOrder} />
            ))
          )}
        </div>
      </section>
    </div>
  );
}

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <Card className="rounded-lg border-[#e8daca] bg-[#fffdf8] p-5 shadow-sm shadow-[#8a461c]/5">
      <p className="text-sm font-bold text-[#8f7461]">{label}</p>
      <strong className="mt-2 block text-3xl font-black text-[#3a2619]">{value}</strong>
    </Card>
  );
}

function OrderCard({
  order,
  saving,
  updateOrder,
}: {
  order: Order;
  saving: boolean;
  updateOrder: (id: string, input: Partial<Pick<Order, "status" | "paymentStatus" | "trackingNumber" | "estimatedDeliveryDate">>) => Promise<void>;
}) {
  return (
    <article className="overflow-hidden rounded-lg border border-[#e6d8c9] bg-white shadow-sm shadow-[#8a461c]/5">
      <header className="border-b border-[#eadccf] bg-[#fff8ed] p-4">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <h3 className="text-xl font-black text-[#3a2619]">Order #{order.orderNumber}</h3>
            <div className="mt-2 grid gap-1 text-sm font-semibold text-[#7f6554]">
              <span className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-[#9a5728]" />
                {formatOrderDate(order.createdAt)}
              </span>
              <span className="flex items-center gap-2">
                <User className="h-4 w-4 text-[#9a5728]" />
                {order.customerName || order.customerEmail}
              </span>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <OrderStatusBadge status={order.status} />
            <PaymentStatusBadge status={order.paymentStatus} />
          </div>
        </div>
      </header>

      <div className="grid gap-5 p-4">
        <div>
          <p className="mb-2 text-sm font-black text-[#5c3a25]">Products:</p>
          <div className="grid gap-2 md:grid-cols-2">
            {order.items.map((item) => (
              <div className="flex justify-between gap-3 rounded-md bg-[#fff8ed] p-2 text-sm" key={`${order.id}-${item.productId}`}>
                <span className="font-bold text-[#3a2619]">
                  {item.productName} <span className="text-[#8f7461]">x{item.quantity}</span>
                </span>
                <span className="font-black text-[#7c3514]">£{item.subtotal.toFixed(2)}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="grid gap-4 border-t border-[#eadccf] pt-4 md:grid-cols-2 xl:grid-cols-4">
          <AdminControl label="Status">
            <select
              className="h-11 rounded-md border border-[#e3d1bd] bg-white px-3 text-sm font-bold text-[#3a2619] outline-none transition-colors focus:border-[#8a461c] disabled:opacity-60"
              disabled={saving}
              onChange={(event) => updateOrder(order.id, { status: event.target.value as OrderStatus })}
              value={order.status}
            >
              {orderStatusOptions.map((status) => (
                <option value={status} key={status}>{orderStatusLabels[status]}</option>
              ))}
            </select>
          </AdminControl>

          <AdminControl label="Payment">
            <select
              className="h-11 rounded-md border border-[#e3d1bd] bg-white px-3 text-sm font-bold text-[#3a2619] outline-none transition-colors focus:border-[#8a461c] disabled:opacity-60"
              disabled={saving}
              onChange={(event) => updateOrder(order.id, { paymentStatus: event.target.value as PaymentStatus })}
              value={order.paymentStatus}
            >
              {paymentStatusOptions.map((status) => (
                <option value={status} key={status}>{paymentStatusLabels[status]}</option>
              ))}
            </select>
          </AdminControl>

          <AdminControl label="Tracking">
            <input
              className="h-11 rounded-md border border-[#e3d1bd] bg-white px-3 text-sm font-bold text-[#3a2619] outline-none transition-colors focus:border-[#8a461c] disabled:opacity-60"
              defaultValue={order.trackingNumber}
              disabled={saving}
              onBlur={(event) => {
                if (event.target.value !== (order.trackingNumber ?? "")) {
                  void updateOrder(order.id, { trackingNumber: event.target.value });
                }
              }}
              placeholder="Tracking ref"
            />
          </AdminControl>

          <AdminControl label="ETA">
            <input
              className="h-11 rounded-md border border-[#e3d1bd] bg-white px-3 text-sm font-bold text-[#3a2619] outline-none transition-colors focus:border-[#8a461c] disabled:opacity-60"
              defaultValue={order.estimatedDeliveryDate}
              disabled={saving}
              onBlur={(event) => {
                if (event.target.value !== (order.estimatedDeliveryDate ?? "")) {
                  void updateOrder(order.id, { estimatedDeliveryDate: event.target.value });
                }
              }}
              type="date"
            />
          </AdminControl>
        </div>

        <div className="flex flex-col gap-3 border-t border-[#eadccf] pt-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <span className="text-sm font-semibold text-[#8f7461]">Total Amount</span>
            <p className="text-2xl font-black text-[#7c3514]">£{order.totalAmount.toFixed(2)}</p>
          </div>
          <div className="flex items-center gap-3">
            {saving && (
              <span className="flex items-center gap-2 text-sm font-black text-[#9a5728]">
                <Save className="h-4 w-4" />
                Saving
              </span>
            )}
            <Button asChildShim className="h-10 rounded-md px-4">
              <Link href={`/orderdetails?id=${order.id}`}>
                Details
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </article>
  );
}

function AdminControl({ children, label }: { children: React.ReactNode; label: string }) {
  return (
    <label className="grid gap-2">
      <span className="text-xs font-black uppercase tracking-[0.12em] text-[#8f7461]">{label}</span>
      {children}
    </label>
  );
}

function OrderStatusBadge({ status }: { status: OrderStatus }) {
  const config = {
    preparing: { icon: Package, className: "border-blue-200 bg-blue-50 text-blue-800" },
    in_transit: { icon: Truck, className: "border-orange-200 bg-orange-50 text-orange-800" },
    delivered: { icon: CheckCircle, className: "border-green-200 bg-green-50 text-green-800" },
  }[status];
  const Icon = config.icon;
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-black ${config.className}`}>
      <Icon className="h-3.5 w-3.5" />
      {orderStatusLabels[status]}
    </span>
  );
}

function PaymentStatusBadge({ status }: { status: PaymentStatus }) {
  const config = {
    pending: { icon: Clock, className: "border-yellow-200 bg-yellow-50 text-yellow-800" },
    paid: { icon: CheckCircle, className: "border-green-200 bg-green-50 text-green-800" },
    failed: { icon: XCircle, className: "border-red-200 bg-red-50 text-red-800" },
  }[status];
  const Icon = config.icon;
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-black ${config.className}`}>
      <Icon className="h-3.5 w-3.5" />
      {paymentStatusLabels[status]}
    </span>
  );
}

function formatOrderDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}
