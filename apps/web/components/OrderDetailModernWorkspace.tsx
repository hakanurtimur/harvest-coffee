"use client";

import MotionReveal from "@/components/MotionReveal";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Combobox } from "@/components/ui/combobox";
import { useCurrentUserQuery, useOrderQuery, useUpdateOrderMutation } from "@/lib/harvest-query";
import type { Order, OrderStatus, PaymentMethod, PaymentStatus } from "@/lib/domain";
import { orderStatusLabels, paymentMethodLabels, paymentStatusLabels } from "@/lib/domain";
import {
  ArrowLeft,
  Building2,
  Calendar,
  CheckCircle,
  Clock,
  CreditCard,
  FileText,
  MapPin,
  Package,
  RefreshCw,
  ShoppingBag,
  Truck,
  XCircle,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";

const paymentMethodOptions = Object.entries(paymentMethodLabels).map(([value, label]) => ({ label, value }));

export default function OrderDetailModernWorkspace({ orderId }: { orderId: string }) {
  const currentUserQuery = useCurrentUserQuery();
  const orderQuery = useOrderQuery(orderId);
  const updateOrderMutation = useUpdateOrderMutation();
  const [message, setMessage] = useState("");
  const order = orderQuery.data ?? null;
  const isLoading = orderQuery.isLoading;
  const loadError = orderQuery.error instanceof Error ? orderQuery.error.message : "";
  const isSaving = updateOrderMutation.isPending;
  const isAdmin = currentUserQuery.data?.role === "admin";
  const backHref = isAdmin ? "/adminorders" : "/orders";
  const backLabel = isAdmin ? "Back to admin orders" : "Back to orders";

  const updatePayment = async (patch: Pick<Order, "paymentMethod"> | Pick<Order, "paymentStatus">) => {
    if (!order) return;
    setMessage("");
    try {
      const updated = await updateOrderMutation.mutateAsync({ id: order.id, input: patch });
      setMessage(`Order #${updated.orderNumber} updated.`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Order could not be updated.");
    }
  };

  return (
    <div className="harvest-theme space-y-5 text-foreground">
      <section className="rounded-2xl border border-border bg-card p-5 shadow-sm shadow-primary/5">
        <MotionReveal>
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.22em] text-primary">{isAdmin ? "Admin" : "Dealer"}</p>
              <h1 className="mt-3 text-4xl font-black leading-tight text-foreground">
                {order ? `Order #${order.orderNumber}` : "Order Details"}
              </h1>
              <p className="mt-2 max-w-2xl text-base font-semibold leading-7 text-muted-foreground">
                {isAdmin ? "Review customer order details, delivery updates and payment information." : "Review order items, delivery notes and payment information."}
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Button asChildShim className="h-11 rounded-md bg-transparent px-5 text-primary hover:bg-secondary" variant="outline">
                <Link href={backHref}>
                  <ArrowLeft className="h-4 w-4" />
                  {backLabel}
                </Link>
              </Button>
              <Button className="h-11 rounded-md px-5" disabled={isLoading} onClick={() => void orderQuery.refetch()} variant="default">
                <RefreshCw className="h-4 w-4" />
                Refresh
              </Button>
            </div>
          </div>
        </MotionReveal>
      </section>

      <section>
        <div>
          {message && (
            <MotionReveal>
              <div
                className={`mb-6 rounded-lg border px-4 py-3 text-sm font-bold ${
                  message.includes("disabled") || message.includes("could not")
                    ? "border-red-200 bg-red-50 text-red-800"
                    : "border-green-200 bg-green-50 text-green-800"
                }`}
              >
                {message}
              </div>
            </MotionReveal>
          )}

          {isLoading ? (
            <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
              <div className="h-96 animate-pulse rounded-lg bg-secondary" />
              <div className="h-80 animate-pulse rounded-lg bg-secondary" />
            </div>
          ) : !order ? (
            <MotionReveal className="mx-auto max-w-2xl" variant="scale">
              <Card className="rounded-lg border-2 border-dashed border-primary/20 bg-background/72 p-10 text-center shadow-none sm:p-12">
                <Package className="mx-auto mb-5 h-16 w-16 text-primary/35" />
                <h2 className="font-display text-2xl font-black text-foreground">Order unavailable</h2>
                <p className="mt-3 text-base font-medium text-muted-foreground">{loadError || "We could not find this order."}</p>
                <Button asChildShim className="mt-6 h-11 rounded-md px-5">
                  <Link href={backHref}>{backLabel}</Link>
                </Button>
              </Card>
            </MotionReveal>
          ) : (
            <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_380px]">
              <MotionReveal className="space-y-6" variant="left">
                <Card className="overflow-hidden rounded-lg border-border bg-background/82 shadow-sm shadow-primary/5">
                  <header className="border-b border-border bg-secondary/55 p-5 sm:p-6">
                    <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                      <div>
                        <h2 className="font-display text-3xl font-black text-foreground">Order #{order.orderNumber}</h2>
                        <div className="mt-2 flex items-center gap-2 text-sm font-medium text-muted-foreground">
                          <Calendar className="h-4 w-4 text-primary" />
                          {formatOrderDate(order.createdAt)}
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <OrderStatusBadge status={order.status} />
                        <PaymentStatusBadge status={order.paymentStatus} />
                      </div>
                    </div>
                  </header>

                  <div className="p-5 sm:p-6">
                    <div className="mb-4 flex items-center gap-2 text-sm font-black text-foreground">
                      <ShoppingBag className="h-4 w-4 text-primary" />
                      Order items
                    </div>
                    <div className="divide-y divide-border">
                      {order.items.map((item, index) => (
                        <div className="flex items-center justify-between gap-4 py-4 first:pt-0 last:pb-0" key={`${item.productId}-${index}`}>
                          <div>
                            <p className="font-bold text-foreground">{item.productName}</p>
                            <p className="mt-1 text-sm font-medium text-muted-foreground">
                              {item.quantity} pcs x £{item.price.toFixed(2)}
                            </p>
                          </div>
                          <p className="font-display text-xl font-black text-primary">£{item.subtotal.toFixed(2)}</p>
                        </div>
                      ))}
                    </div>
                    <div className="mt-6 flex items-center justify-between border-t-2 border-primary/20 pt-6">
                      <span className="text-lg font-black text-foreground">Total Amount</span>
                      <span className="font-display text-4xl font-black text-primary">£{order.totalAmount.toFixed(2)}</span>
                    </div>
                  </div>
                </Card>

                {order.deliveryAddress && (
                  <DetailCard icon={MapPin} kicker="Delivery" title="Delivery Address">
                    <p className="whitespace-pre-line text-sm font-medium leading-7 text-muted-foreground">{order.deliveryAddress}</p>
                  </DetailCard>
                )}

                {order.notes && (
                  <DetailCard icon={FileText} kicker="Notes" title="Order Notes">
                    <p className="whitespace-pre-line text-sm font-medium leading-7 text-muted-foreground">{order.notes}</p>
                  </DetailCard>
                )}
              </MotionReveal>

              <MotionReveal delay={120} variant="right">
                <Card className="rounded-lg border-border bg-background/92 p-5 shadow-xl shadow-primary/10 lg:sticky lg:top-28 sm:p-6">
                  <div className="mb-6">
                    <p className="text-xs font-black uppercase tracking-[0.28em] text-primary">Payment</p>
                    <h2 className="mt-2 flex items-center gap-2 font-display text-2xl font-black text-foreground">
                      <CreditCard className="h-5 w-5 text-primary" />
                      Information
                    </h2>
                  </div>

                  <label className="block">
                    <span className="text-sm font-bold text-foreground">Payment Method</span>
                    <Combobox
                      className="mt-2 h-12 rounded-md"
                      disabled={isSaving}
                      loading={isSaving}
                      onChange={(value) => updatePayment({ paymentMethod: value as PaymentMethod })}
                      options={paymentMethodOptions}
                      placeholder="Payment method"
                      value={order.paymentMethod}
                    />
                  </label>

                  <div className="mt-6 rounded-lg border border-border bg-secondary/55 p-4">
                    <p className="text-sm font-bold text-muted-foreground">Payment Status</p>
                    <div className="mt-3">
                      <PaymentStatusBadge status={order.paymentStatus} />
                    </div>
                  </div>

                  {order.paymentStatus === "pending" && (
                    <Button className="mt-6 h-12 w-full rounded-md" disabled={isSaving} onClick={() => updatePayment({ paymentStatus: "paid" })}>
                      <Building2 className="h-4 w-4" />
                      Mark payment notified
                    </Button>
                  )}
                </Card>
              </MotionReveal>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

function DetailCard({ children, icon: Icon, kicker, title }: { children: React.ReactNode; icon: React.ComponentType<{ className?: string }>; kicker: string; title: string }) {
  return (
    <Card className="rounded-lg border-border bg-background/82 p-5 shadow-sm shadow-primary/5 sm:p-6">
      <p className="text-xs font-black uppercase tracking-[0.25em] text-primary">{kicker}</p>
      <h2 className="mt-2 flex items-center gap-2 font-display text-2xl font-black text-foreground">
        <Icon className="h-5 w-5 text-primary" />
        {title}
      </h2>
      <div className="mt-4">{children}</div>
    </Card>
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

function OrderStatusBadge({ status }: { status: OrderStatus }) {
  const config = {
    preparing: { icon: Package, className: "border-blue-200 bg-blue-50 text-blue-800" },
    in_transit: { icon: Truck, className: "border-orange-200 bg-orange-50 text-orange-800" },
    delivered: { icon: CheckCircle, className: "border-green-200 bg-green-50 text-green-800" },
  }[status];
  const Icon = config.icon;
  return (
    <Badge className={`${config.className} gap-1.5`}>
      <Icon className="h-4 w-4" />
      {orderStatusLabels[status]}
    </Badge>
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
    <Badge className={`${config.className} gap-1.5`}>
      <Icon className="h-4 w-4" />
      {paymentStatusLabels[status]}
    </Badge>
  );
}
