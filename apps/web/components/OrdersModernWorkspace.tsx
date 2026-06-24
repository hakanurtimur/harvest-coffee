"use client";

import MotionReveal from "@/components/MotionReveal";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useMyOrdersQuery } from "@/lib/harvest-query";
import type { Order, OrderStatus, PaymentStatus } from "@/lib/domain";
import { ArrowRight, Calendar, CheckCircle, Clock, Package, Search, ShoppingBag, Truck, XCircle } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

export default function OrdersModernWorkspace() {
  const router = useRouter();
  const ordersQuery = useMyOrdersQuery();
  const orders = ordersQuery.data ?? [];
  const isLoading = ordersQuery.isLoading;
  const error = ordersQuery.error instanceof Error ? ordersQuery.error.message : "";
  const pendingOrders = orders.filter((order) => order.status !== "delivered").length;
  const totalSpent = orders.reduce((sum, order) => sum + order.totalAmount, 0);
  const [trackOrderNumber, setTrackOrderNumber] = useState("");

  const handleTrackOrder = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const nextOrderNumber = trackOrderNumber.trim();
    router.push(nextOrderNumber ? `/trackorder?order_number=${encodeURIComponent(nextOrderNumber)}` : "/trackorder");
  };

  return (
    <div className="harvest-theme overflow-hidden bg-background text-foreground">
      <section className="relative px-5 pb-6 pt-0 sm:px-8 lg:px-10">
        <MotionReveal className="relative mx-auto max-w-7xl">
          <Card className="overflow-hidden rounded-2xl border-border bg-card p-5 shadow-sm shadow-primary/5 sm:p-6">
            <div className="relative flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
              <CoffeeBranchAsset className="pointer-events-none absolute -right-16 -top-24 h-56 w-56 -scale-x-100 bg-primary/[0.045]" />
              <div className="relative">
                <p className="text-[10px] font-black uppercase tracking-[0.28em] text-primary">Dealer orders</p>
                <h1 className="mt-2 text-3xl font-black tracking-normal text-foreground sm:text-4xl">My Orders</h1>
                <p className="mt-2 max-w-2xl text-sm font-semibold leading-6 text-muted-foreground">
                  Track live order status, payment state, delivery details, and previous order totals from your dealer workspace.
                </p>
              </div>
              <div className="relative grid gap-3 sm:grid-cols-3 lg:min-w-[440px]">
                <DealerMetric label="Orders" value={orders.length.toString()} />
                <DealerMetric label="Open" value={pendingOrders.toString()} />
                <DealerMetric label="Total" value={`£${totalSpent.toFixed(2)}`} />
              </div>
            </div>
          </Card>
        </MotionReveal>
      </section>

      <section className="relative bg-background px-5 py-6 sm:px-8 lg:px-10 lg:py-8">
        <CoffeeBranchAsset className="absolute -left-24 bottom-0 h-60 w-60 bg-primary/[0.07]" />
        <div className="relative mx-auto max-w-7xl">
          <MotionReveal className="mb-5">
            <Card className="rounded-2xl border-border bg-card p-4 shadow-sm shadow-primary/5 sm:p-5">
              <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(360px,0.75fr)] lg:items-center">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.22em] text-primary">Quick tracking</p>
                  <h2 className="mt-1 text-xl font-black tracking-normal text-foreground">Track by order number</h2>
                  <p className="mt-1 text-sm font-semibold leading-6 text-muted-foreground">
                    Use this when a customer shares an order number or you want to jump straight to a delivery update.
                  </p>
                </div>
                <form className="flex flex-col gap-2 sm:flex-row" onSubmit={handleTrackOrder}>
                  <label className="sr-only" htmlFor="dealer-track-order-number">Order number</label>
                  <input
                    id="dealer-track-order-number"
                    className="h-11 min-w-0 flex-1 rounded-xl border border-border bg-background px-4 text-sm font-semibold text-foreground outline-none transition placeholder:text-muted-foreground/65 focus:border-primary focus:ring-4 focus:ring-primary/10"
                    value={trackOrderNumber}
                    onChange={(event) => setTrackOrderNumber(event.target.value)}
                    placeholder="e.g. HC12345678"
                  />
                  <Button className="h-11 rounded-xl px-4 text-sm" type="submit">
                    <Search className="h-4 w-4" />
                    Track
                  </Button>
                </form>
              </div>
            </Card>
          </MotionReveal>

          {isLoading ? (
            <div className="space-y-4">
              {[0, 1, 2].map((item) => (
                <div key={item} className="h-48 animate-pulse rounded-lg bg-secondary" />
              ))}
            </div>
          ) : error ? (
            <MotionReveal className="mx-auto max-w-2xl" variant="scale">
              <Card className="rounded-lg border-2 border-dashed border-primary/20 bg-background/72 p-10 text-center shadow-none sm:p-12">
                <Package className="mx-auto mb-5 h-16 w-16 text-primary/35" />
                <h2 className="font-display text-2xl font-black text-foreground">Orders unavailable</h2>
                <p className="mt-3 text-base font-medium text-muted-foreground">{error}</p>
                <Button asChildShim className="mt-6 h-11 rounded-md px-5">
                  <Link href="/login">
                    Sign in
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
              </Card>
            </MotionReveal>
          ) : orders.length === 0 ? (
            <MotionReveal className="mx-auto max-w-2xl" variant="scale">
              <Card className="rounded-lg border-2 border-dashed border-primary/20 bg-background/72 p-10 text-center shadow-none sm:p-12">
                <Package className="mx-auto mb-5 h-16 w-16 text-primary/35" />
                <h2 className="font-display text-2xl font-black text-foreground">No orders yet</h2>
                <p className="mt-3 text-base font-medium text-muted-foreground">Start browsing products and place your first order</p>
                <Button asChildShim className="mt-6 h-11 rounded-md px-5">
                  <Link href="/products">
                    Go to Products
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
              </Card>
            </MotionReveal>
          ) : (
            <div className="space-y-5">
              {orders.map((order, index) => (
                <MotionReveal delay={index * 60} key={order.id}>
                  <OrderCard order={order} />
                </MotionReveal>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

function DealerMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border bg-background/80 p-4">
      <p className="text-[10px] font-black uppercase tracking-[0.18em] text-muted-foreground">{label}</p>
      <p className="mt-2 text-2xl font-black tracking-normal text-foreground">{value}</p>
    </div>
  );
}

function OrderCard({ order }: { order: Order }) {
  return (
    <Card className="motion-card overflow-hidden rounded-lg border-border bg-background/82 shadow-sm shadow-primary/5 hover:border-primary/20 hover:shadow-xl hover:shadow-primary/10">
      <header className="border-b border-border bg-secondary/55 p-5 sm:p-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="font-display text-2xl font-black text-foreground">Order #{order.orderNumber}</h2>
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
        <div>
          <div className="mb-3 flex items-center gap-2 text-sm font-black text-foreground">
            <ShoppingBag className="h-4 w-4 text-primary" />
            Products:
          </div>
          <div className="space-y-2">
            {order.items.slice(0, 3).map((item) => (
              <p key={`${order.id}-${item.productId}`} className="text-sm font-medium text-foreground">
                {item.productName} <span className="text-muted-foreground">x{item.quantity}</span>
              </p>
            ))}
            {order.items.length > 3 && <p className="text-sm font-medium text-muted-foreground">+{order.items.length - 3} more products</p>}
          </div>
        </div>

        <div className="mt-6 flex flex-col gap-4 border-t border-border pt-5 sm:flex-row sm:items-center sm:justify-between">
          <span className="font-display text-3xl font-black text-primary">£{order.totalAmount.toFixed(2)}</span>
          <Button asChildShim className="h-11 rounded-md px-5">
            <Link href={`/orderdetails?id=${order.id}`}>
              Details
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      </div>
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
    preparing: { label: "Preparing", icon: Package, className: "border-blue-200 bg-blue-50 text-blue-800" },
    in_transit: { label: "In Transit", icon: Truck, className: "border-orange-200 bg-orange-50 text-orange-800" },
    delivered: { label: "Delivered", icon: CheckCircle, className: "border-green-200 bg-green-50 text-green-800" },
  }[status];
  const Icon = config.icon;
  return (
    <Badge className={`${config.className} gap-1.5`}>
      <Icon className="h-4 w-4" />
      {config.label}
    </Badge>
  );
}

function PaymentStatusBadge({ status }: { status: PaymentStatus }) {
  const config = {
    pending: { label: "Pending", icon: Clock, className: "border-yellow-200 bg-yellow-50 text-yellow-800" },
    paid: { label: "Paid", icon: CheckCircle, className: "border-green-200 bg-green-50 text-green-800" },
    failed: { label: "Failed", icon: XCircle, className: "border-red-200 bg-red-50 text-red-800" },
  }[status];
  const Icon = config.icon;
  return (
    <Badge className={`${config.className} gap-1.5`}>
      <Icon className="h-4 w-4" />
      {config.label}
    </Badge>
  );
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
