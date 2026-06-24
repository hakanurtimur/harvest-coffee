"use client";

import MotionReveal from "@/components/MotionReveal";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useOrderByNumberQuery } from "@/lib/harvest-query";
import type { Order, OrderStatus, PaymentStatus } from "@/lib/domain";
import { ArrowLeft, Calendar, CheckCircle, Clock, MapPin, Package, Search, Truck, XCircle } from "lucide-react";
import Link from "next/link";
import { FormEvent, useState } from "react";

const statusSteps: OrderStatus[] = ["preparing", "in_transit", "delivered"];

export default function TrackOrderModernWorkspace({ variant = "public" }: { variant?: "public" | "app" }) {
  const initialOrderNumber = typeof window === "undefined" ? "" : new URLSearchParams(window.location.search).get("order_number") || "";
  const [orderNumber, setOrderNumber] = useState(initialOrderNumber);
  const [searchOrderNumber, setSearchOrderNumber] = useState(initialOrderNumber);
  const orderQuery = useOrderByNumberQuery(searchOrderNumber);
  const order = orderQuery.data ?? null;
  const isLoading = orderQuery.isFetching;

  const handleSearch = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSearchOrderNumber(orderNumber);
  };

  const results = (
    <div className="space-y-5">
      {isLoading && (
        <div>
          <div className="h-80 animate-pulse rounded-2xl border border-border bg-card" />
        </div>
      )}

      {!isLoading && searchOrderNumber && !order && (
        <Card className="rounded-2xl border-2 border-dashed border-primary/20 bg-card p-10 text-center shadow-none sm:p-12">
          <Package className="mx-auto mb-5 h-16 w-16 text-primary/35" />
          <h2 className="text-2xl font-black text-foreground">Order not found</h2>
          <p className="mt-4 text-base font-medium leading-7 text-muted-foreground">
            We couldn&apos;t find an order with number: <strong className="text-foreground">{searchOrderNumber}</strong>
          </p>
          <p className="mt-4 text-sm font-medium text-muted-foreground/80">Please check your order number and try again.</p>
        </Card>
      )}

      {!isLoading && order && (
        <div className="space-y-5">
          <OrderHero order={order} />
          <DeliveryStatus order={order} />
          {order.deliveryAddress && <DeliveryAddress address={order.deliveryAddress} />}
          <OrderItems order={order} />
          <div className="text-center">
            <Button asChildShim className="h-11 rounded-md bg-transparent px-5 text-primary hover:bg-secondary" variant="outline">
              <Link href="/orders">
                <ArrowLeft className="h-4 w-4" />
                View All Orders
              </Link>
            </Button>
          </div>
        </div>
      )}
    </div>
  );

  if (variant === "public") {
    return (
      <div className="harvest-theme overflow-hidden bg-background text-foreground">
        <section className="relative px-5 pb-12 pt-32 text-center sm:px-8 lg:px-10">
          <CoffeeBranchAsset className="absolute -left-20 top-10 h-72 w-72 bg-primary/[0.09]" />
          <CoffeeBranchAsset className="absolute -right-16 top-8 h-72 w-72 -scale-x-100 bg-primary/[0.09]" />
          <MotionReveal className="relative mx-auto max-w-4xl">
            <p className="mb-5 text-xs font-black uppercase tracking-[0.34em] text-primary">Order Tracking</p>
            <h1 className="font-display text-5xl font-black leading-tight text-foreground sm:text-6xl lg:text-7xl">Track Your Order</h1>
            <div className="mx-auto mt-6 flex w-44 items-center justify-center gap-3 text-primary/70">
              <span className="h-px flex-1 bg-primary/35" />
              <span className="grid h-5 w-5 place-items-center rounded-full border border-primary/40 text-[10px] font-black">H</span>
              <span className="h-px flex-1 bg-primary/35" />
            </div>
            <p className="mx-auto mt-6 max-w-2xl text-lg font-medium leading-8 text-muted-foreground">
              Enter your order number to track its status
            </p>
          </MotionReveal>
        </section>

        <section className="relative bg-card px-5 py-10 sm:px-8 lg:px-10 lg:py-14">
          <CoffeeBranchAsset className="absolute -left-24 bottom-0 h-60 w-60 bg-primary/[0.07]" />
          <MotionReveal className="relative mx-auto max-w-2xl">
            <Card className="rounded-lg border-border bg-background/72 p-6 shadow-2xl shadow-primary/10 backdrop-blur-sm">
              <form className="space-y-4" onSubmit={handleSearch}>
                <label className="block">
                  <span className="mb-2 block text-sm font-bold text-foreground/70">Order Number</span>
                  <div className="flex flex-col gap-3 sm:flex-row">
                    <input
                      className="h-12 flex-1 rounded-md border border-border bg-background/70 px-4 text-sm font-medium text-foreground outline-none transition placeholder:text-muted-foreground/65 focus:border-primary focus:ring-4 focus:ring-primary/10"
                      value={orderNumber}
                      onChange={(event) => setOrderNumber(event.target.value)}
                      placeholder="e.g., HC12345678"
                    />
                    <Button className="h-12 rounded-md px-6" type="submit">
                      <Search className="h-4 w-4" />
                      Track
                    </Button>
                  </div>
                </label>
              </form>
            </Card>
          </MotionReveal>
        </section>

        <section className="bg-background px-5 py-10 sm:px-8 lg:px-10 lg:py-14">
          <div className="mx-auto max-w-5xl">{results}</div>
        </section>
      </div>
    );
  }

  return (
    <div className="harvest-theme space-y-5 text-foreground">
      <Card className="rounded-2xl border-border bg-card p-5 shadow-sm sm:p-6">
        <div className="grid gap-5 lg:grid-cols-[1fr_520px] lg:items-end">
          <div>
            <p className="text-[11px] font-black uppercase tracking-[0.24em] text-primary">Dealer</p>
            <h1 className="mt-2 text-3xl font-black tracking-tight text-foreground sm:text-4xl">Track order</h1>
            <p className="mt-2 max-w-2xl text-sm font-semibold leading-6 text-muted-foreground">
              Enter an order number to check status, delivery details, payment state, and ordered items.
            </p>
          </div>
          <form className="grid gap-3 sm:grid-cols-[1fr_auto]" onSubmit={handleSearch}>
            <label className="sr-only" htmlFor="track-order-number">Order Number</label>
            <input
              id="track-order-number"
              className="h-12 rounded-xl border border-border bg-background px-4 text-sm font-semibold text-foreground outline-none transition placeholder:text-muted-foreground/65 focus:border-primary focus:ring-4 focus:ring-primary/10"
              value={orderNumber}
              onChange={(event) => setOrderNumber(event.target.value)}
              placeholder="e.g., HC12345678"
            />
            <Button className="h-12 rounded-xl px-6" type="submit">
              <Search className="h-4 w-4" />
              Track
            </Button>
          </form>
        </div>
      </Card>

      {results}
    </div>
  );
}

function OrderHero({ order }: { order: Order }) {
  return (
    <Card className="rounded-lg border-primary/15 bg-card p-6 shadow-xl shadow-primary/5">
      <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
        <div>
          <h2 className="font-display text-4xl font-black text-foreground">Order #{order.orderNumber}</h2>
          <div className="mt-4 space-y-2 text-sm font-medium text-muted-foreground">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-primary" />
              <span>Ordered: {formatLongDate(order.createdAt)}</span>
            </div>
            {order.estimatedDeliveryDate && (
              <div className="flex items-center gap-2">
                <Truck className="h-4 w-4 text-primary" />
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
    </Card>
  );
}

function DeliveryStatus({ order }: { order: Order }) {
  return (
    <Card className="rounded-lg border-border bg-card p-6 shadow-sm shadow-primary/5">
      <h2 className="font-display text-2xl font-black text-foreground">Delivery Status</h2>
      <div className="mt-6">
        <div className="h-2 w-full rounded-full bg-secondary">
          <div
            className="h-2 rounded-full bg-gradient-to-r from-blue-600 via-primary to-green-600 transition-all duration-500"
            style={{ width: `${getStatusProgress(order.status)}%` }}
          />
        </div>
      </div>
      <div className="mt-8 grid gap-6 md:grid-cols-3">
        <StatusStep status="preparing" currentStatus={order.status} title="Preparing" description="Your order is being prepared" activeClass="text-blue-900" />
        <StatusStep
          status="in_transit"
          currentStatus={order.status}
          title="In Transit"
          description="On the way to you"
          activeClass="text-primary"
          trackingNumber={order.trackingNumber}
        />
        <StatusStep status="delivered" currentStatus={order.status} title="Delivered" description="Order completed" activeClass="text-green-900" />
      </div>
    </Card>
  );
}

function DeliveryAddress({ address }: { address: string }) {
  return (
    <Card className="rounded-lg border-border bg-card p-6 shadow-sm shadow-primary/5">
      <h2 className="flex items-center gap-2 font-display text-2xl font-black text-foreground">
        <MapPin className="h-5 w-5 text-primary" />
        Delivery Address
      </h2>
      <p className="mt-4 whitespace-pre-line text-base font-medium leading-7 text-muted-foreground">{address}</p>
    </Card>
  );
}

function OrderItems({ order }: { order: Order }) {
  return (
    <Card className="rounded-lg border-border bg-card p-6 shadow-sm shadow-primary/5">
      <h2 className="font-display text-2xl font-black text-foreground">Order Items</h2>
      <div className="mt-5 space-y-2">
        {order.items.map((item, index) => (
          <div className="flex items-center justify-between gap-4 border-b border-border/70 py-3 last:border-0" key={`${item.productId}-${index}`}>
            <div>
              <p className="font-bold text-foreground">{item.productName}</p>
              <p className="text-sm font-medium text-muted-foreground">Qty: {item.quantity}</p>
            </div>
            <p className="font-display text-xl font-black text-primary">£{item.subtotal.toFixed(2)}</p>
          </div>
        ))}
      </div>
      <div className="mt-6 border-t-2 border-primary/20 pt-5">
        <div className="flex items-center justify-between gap-4">
          <span className="font-display text-2xl font-black text-foreground">Total</span>
          <span className="font-display text-3xl font-black text-primary">£{order.totalAmount.toFixed(2)}</span>
        </div>
      </div>
    </Card>
  );
}

function StatusStep({
  activeClass,
  currentStatus,
  description,
  status,
  title,
  trackingNumber,
}: {
  activeClass: string;
  currentStatus: OrderStatus;
  description: string;
  status: OrderStatus;
  title: string;
  trackingNumber?: string;
}) {
  const active = status === currentStatus;
  return (
    <div className="rounded-lg border border-border bg-background/60 p-5 text-center">
      <div className="mb-4 flex justify-center">{getStatusIcon(status, currentStatus)}</div>
      <h3 className={`font-display text-xl font-black ${active ? activeClass : "text-muted-foreground"}`}>{title}</h3>
      <p className="mt-2 text-xs font-medium text-muted-foreground">{description}</p>
      {trackingNumber && status === "in_transit" && active && (
        <p className="mt-2 text-xs font-black text-primary">Tracking: {trackingNumber}</p>
      )}
    </div>
  );
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

function getStatusProgress(status: OrderStatus) {
  const index = statusSteps.indexOf(status);
  return index < 0 ? 0 : ((index + 1) / statusSteps.length) * 100;
}

function getStatusIcon(status: OrderStatus, currentStatus: OrderStatus) {
  const currentIndex = statusSteps.indexOf(currentStatus);
  const statusIndex = statusSteps.indexOf(status);

  if (statusIndex < currentIndex) return <CheckCircle className="h-8 w-8 text-green-600" />;
  if (statusIndex === currentIndex) {
    if (status === "preparing") return <Package className="h-8 w-8 text-blue-600" />;
    if (status === "in_transit") return <Truck className="h-8 w-8 text-primary" />;
    if (status === "delivered") return <CheckCircle className="h-8 w-8 text-green-600" />;
  }

  return <div className="h-8 w-8 rounded-full border-2 border-border" />;
}

function formatLongDate(value: string) {
  return new Intl.DateTimeFormat("en-GB", { day: "2-digit", month: "long", year: "numeric" }).format(new Date(value));
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
