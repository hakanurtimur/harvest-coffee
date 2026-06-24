"use client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Combobox } from "@/components/ui/combobox";
import { DatePicker } from "@/components/ui/date-picker";
import AdminPageHeader from "@/components/AdminPageHeader";
import { useOrdersQuery, useUpdateOrderMutation } from "@/lib/harvest-query";
import type { Order, OrderStatus, PaymentStatus } from "@/lib/domain";
import { orderStatusLabels, paymentStatusLabels } from "@/lib/domain";
import { ArrowRight, Calendar, CheckCircle, Clock, Filter, Package, RefreshCw, Save, Truck, User, XCircle } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

const orderStatusOptions: OrderStatus[] = ["preparing", "in_transit", "delivered"];
const paymentStatusOptions: PaymentStatus[] = ["pending", "paid", "failed"];
const statusFilterOptions = [{ label: "All statuses", value: "all" }, ...orderStatusOptions.map((status) => ({ label: orderStatusLabels[status], value: status }))];
const paymentFilterOptions = [{ label: "All payments", value: "all" }, ...paymentStatusOptions.map((status) => ({ label: paymentStatusLabels[status], value: status }))];
const orderStatusComboboxOptions = orderStatusOptions.map((status) => ({ label: orderStatusLabels[status], value: status }));
const paymentStatusComboboxOptions = paymentStatusOptions.map((status) => ({ label: paymentStatusLabels[status], value: status }));
type StatusFilter = "all" | OrderStatus;
type PaymentFilter = "all" | PaymentStatus;

export default function AdminOrdersModernWorkspace() {
  const ordersQuery = useOrdersQuery();
  const updateOrderMutation = useUpdateOrderMutation();
  const [message, setMessage] = useState("");
  const [savingOrderId, setSavingOrderId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [paymentFilter, setPaymentFilter] = useState<PaymentFilter>("all");
  const orders = ordersQuery.data ?? [];
  const isLoading = ordersQuery.isLoading;

  const updateOrder = async (id: string, input: Partial<Pick<Order, "status" | "paymentStatus" | "trackingNumber" | "estimatedDeliveryDate">>) => {
    setSavingOrderId(id);
    setMessage("");
    try {
      const updated = await updateOrderMutation.mutateAsync({ id, input });
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
    <div className="harvest-theme space-y-5 text-foreground">
      <AdminPageHeader
        title="Orders"
        description="Manage order queue"
        actions={
          <Button className="h-10 rounded-md px-4" disabled={isLoading} onClick={() => void ordersQuery.refetch()}>
            <RefreshCw className="h-4 w-4" />
            Refresh
          </Button>
        }
      />

      {message && (
        <div
          className={`rounded-lg border px-4 py-3 text-sm font-bold ${
            message.includes("disabled") || message.includes("could not")
              ? "border-[hsl(var(--status-danger)/0.24)] bg-[hsl(var(--status-danger)/0.08)] text-[hsl(var(--status-danger))]"
              : "border-[hsl(var(--status-success)/0.24)] bg-[hsl(var(--status-success)/0.08)] text-[hsl(var(--status-success))]"
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

      <Card className="rounded-2xl border-border bg-card p-4 shadow-sm shadow-primary/5">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
          <div className="flex items-center gap-2 text-sm font-black text-foreground">
            <Filter className="h-4 w-4 text-primary" />
            Filters:
          </div>
          <Combobox className="h-10 w-44 rounded-md" onChange={(value) => setStatusFilter(value as StatusFilter)} options={statusFilterOptions} placeholder="All statuses" value={statusFilter} />
          <Combobox className="h-10 w-44 rounded-md" onChange={(value) => setPaymentFilter(value as PaymentFilter)} options={paymentFilterOptions} placeholder="All payments" value={paymentFilter} />
          <p className="text-sm font-semibold text-muted-foreground lg:ml-auto">
            <span className="font-black text-primary">{filteredOrders.length}</span> orders
          </p>
        </div>
      </Card>

      <section className="rounded-2xl border border-border bg-card shadow-sm shadow-primary/5">
        <header className="flex flex-col gap-3 border-b border-border px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.18em] text-primary">Operations</p>
            <h2 className="mt-1 text-xl font-black text-foreground">Manage order queue</h2>
          </div>
          <strong className="text-lg font-black text-primary">GBP {revenue.toFixed(2)}</strong>
        </header>

        <div className="grid gap-4 p-5">
          {isLoading ? (
            <div className="grid gap-3">
              {[0, 1, 2].map((item) => (
                <div className="h-40 animate-pulse rounded-lg bg-muted" key={item} />
              ))}
            </div>
          ) : filteredOrders.length === 0 ? (
            <div className="rounded-2xl border-2 border-dashed border-border p-10 text-center">
              <Package className="mx-auto mb-4 h-14 w-14 text-primary/35" />
              <h3 className="text-lg font-black text-foreground">No orders found</h3>
              <p className="mt-1 text-sm font-semibold text-muted-foreground">No orders match the selected filters.</p>
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
    <Card className="rounded-2xl border-border bg-card p-5 shadow-sm shadow-primary/5">
      <p className="text-sm font-bold text-muted-foreground">{label}</p>
      <strong className="mt-2 block text-3xl font-black text-foreground">{value}</strong>
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
    <article className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm shadow-primary/5">
      <header className="border-b border-border bg-muted p-4">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <h3 className="text-xl font-black text-foreground">Order #{order.orderNumber}</h3>
            <div className="mt-2 grid gap-1 text-sm font-semibold text-muted-foreground">
              <span className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-primary" />
                {formatOrderDate(order.createdAt)}
              </span>
              <span className="flex items-center gap-2">
                <User className="h-4 w-4 text-primary" />
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
          <p className="mb-2 text-sm font-black text-foreground">Products:</p>
          <div className="grid gap-2 md:grid-cols-2">
            {order.items.map((item) => (
              <div className="flex justify-between gap-3 rounded-md bg-muted p-2 text-sm" key={`${order.id}-${item.productId}`}>
                <span className="font-bold text-foreground">
                  {item.productName} <span className="text-muted-foreground">x{item.quantity}</span>
                </span>
                <span className="font-black text-primary">£{item.subtotal.toFixed(2)}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="grid gap-4 border-t border-border pt-4 md:grid-cols-2 xl:grid-cols-4">
          <AdminControl label="Status">
            <Combobox
              disabled={saving}
              loading={saving}
              onChange={(value) => updateOrder(order.id, { status: value as OrderStatus })}
              options={orderStatusComboboxOptions}
              placeholder="Status"
              value={order.status}
            />
          </AdminControl>

          <AdminControl label="Payment">
            <Combobox
              disabled={saving}
              loading={saving}
              onChange={(value) => updateOrder(order.id, { paymentStatus: value as PaymentStatus })}
              options={paymentStatusComboboxOptions}
              placeholder="Payment"
              value={order.paymentStatus}
            />
          </AdminControl>

          <AdminControl label="Tracking">
            <input
              className="h-11 rounded-md border border-border bg-background px-3 text-sm font-bold text-foreground outline-none transition-colors focus:border-primary disabled:opacity-60"
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
            <DatePicker
              disabled={saving}
              id={`admin-order-eta-${order.id}`}
              onChange={(value) => {
                if (value !== (order.estimatedDeliveryDate ?? "")) {
                  void updateOrder(order.id, { estimatedDeliveryDate: value });
                }
              }}
              placeholder="Select ETA"
              value={order.estimatedDeliveryDate ?? ""}
            />
          </AdminControl>
        </div>

        <div className="flex flex-col gap-3 border-t border-border pt-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <span className="text-sm font-semibold text-muted-foreground">Total Amount</span>
            <p className="text-2xl font-black text-primary">£{order.totalAmount.toFixed(2)}</p>
          </div>
          <div className="flex items-center gap-3">
            {saving && (
              <span className="flex items-center gap-2 text-sm font-black text-primary">
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
      <span className="text-xs font-black uppercase tracking-[0.12em] text-muted-foreground">{label}</span>
      {children}
    </label>
  );
}

function OrderStatusBadge({ status }: { status: OrderStatus }) {
  const config = {
    preparing: { icon: Package, className: "border-[hsl(var(--status-info)/0.24)] bg-[hsl(var(--status-info)/0.08)] text-[hsl(var(--status-info))]" },
    in_transit: { icon: Truck, className: "border-[hsl(var(--status-warning)/0.24)] bg-[hsl(var(--status-warning)/0.08)] text-[hsl(var(--status-warning))]" },
    delivered: { icon: CheckCircle, className: "border-[hsl(var(--status-success)/0.24)] bg-[hsl(var(--status-success)/0.08)] text-[hsl(var(--status-success))]" },
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
    pending: { icon: Clock, className: "border-[hsl(var(--status-warning)/0.24)] bg-[hsl(var(--status-warning)/0.08)] text-[hsl(var(--status-warning))]" },
    paid: { icon: CheckCircle, className: "border-[hsl(var(--status-success)/0.24)] bg-[hsl(var(--status-success)/0.08)] text-[hsl(var(--status-success))]" },
    failed: { icon: XCircle, className: "border-[hsl(var(--status-danger)/0.24)] bg-[hsl(var(--status-danger)/0.08)] text-[hsl(var(--status-danger))]" },
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
