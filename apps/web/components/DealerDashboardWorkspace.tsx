"use client";

import MotionReveal from "@/components/MotionReveal";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  useCurrentUserQuery,
  useMyOrdersQuery,
  useMyRentalsQuery,
  useNotificationsQuery,
  useProductsQuery,
} from "@/lib/harvest-query";
import {
  calculateOrderItems,
  calculateOrderTotal,
  orderStatusLabels,
  paymentStatusLabels,
  type Notification,
  type Order,
  type Product,
  type Rental,
} from "@/lib/domain";
import { ArrowRight, Bell, CalendarDays, CheckCircle2, Clock3, Coffee, Plus, ShoppingCart, Sparkles } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";

type Cart = Record<string, number>;
type ActivityItem = {
  id: string;
  title: string;
  description: string;
  href: string;
  date?: string;
  tone: "order" | "rental" | "notification";
};

export default function DealerDashboardWorkspace() {
  const currentUserQuery = useCurrentUserQuery();
  const productsQuery = useProductsQuery();
  const ordersQuery = useMyOrdersQuery();
  const rentalsQuery = useMyRentalsQuery();
  const notificationsQuery = useNotificationsQuery();
  const [quickCart, setQuickCart] = useState<Cart>({});

  const currentUser = currentUserQuery.data ?? null;
  const products = productsQuery.data ?? [];
  const orders = ordersQuery.data ?? [];
  const rentals = rentalsQuery.data ?? [];
  const notifications = notificationsQuery.data ?? [];
  const quickProducts = useMemo(() => getQuickOrderProducts(products, orders), [products, orders]);
  const quickItems = useMemo(() => calculateOrderItems(products, quickCart), [products, quickCart]);
  const quickTotal = calculateOrderTotal(quickItems);
  const quickCartHref = useMemo(() => buildQuickCartHref(quickCart), [quickCart]);
  const openOrders = orders.filter((order) => order.status !== "delivered");
  const activeRentals = rentals.filter((rental) => rental.status === "active" || rental.status === "upcoming");
  const unreadNotifications = notifications.filter((notification) => !notification.read).length;
  const activities = useMemo(() => getRecentActivities(orders, rentals, notifications), [orders, rentals, notifications]);
  const isLoading = productsQuery.isLoading || ordersQuery.isLoading || rentalsQuery.isLoading || notificationsQuery.isLoading;

  const updateQuickQuantity = (productId: string, quantity: number) => {
    setQuickCart((current) => {
      const next = { ...current };
      if (quantity <= 0) delete next[productId];
      else next[productId] = quantity;
      return next;
    });
  };

  return (
    <div className="harvest-theme bg-background text-foreground">
      <section className="relative grid gap-6">
        <MotionReveal>
          <Card className="relative overflow-hidden rounded-2xl border-border bg-card p-5 shadow-sm shadow-primary/5 sm:p-6">
            <CoffeeBranchAsset className="pointer-events-none absolute -right-20 -top-24 h-64 w-64 -scale-x-100 bg-primary/[0.045]" />
            <div className="relative flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.28em] text-primary">Dealer dashboard</p>
                <h1 className="mt-2 text-3xl font-black tracking-normal text-foreground sm:text-4xl">
                  Welcome back{currentUser?.fullName ? `, ${currentUser.fullName.split(" ")[0]}` : ""}
                </h1>
                <p className="mt-2 max-w-2xl text-sm font-semibold leading-6 text-muted-foreground">
                  Your B2B ordering workspace: quick reorder, recent activity, open orders, and active rental snapshots.
                </p>
              </div>
              <div className="flex flex-col gap-2 sm:flex-row">
                <Button asChildShim className="h-11 rounded-md">
                  <Link href="/products">
                    Place order
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
                <Button asChildShim className="h-11 rounded-md" variant="outline">
                  <Link href="/orders">View orders</Link>
                </Button>
              </div>
            </div>
          </Card>
        </MotionReveal>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <DashboardMetric icon={ShoppingCart} label="Total orders" tone="primary" value={orders.length.toString()} />
          <DashboardMetric icon={Clock3} label="Open orders" tone="warning" value={openOrders.length.toString()} />
          <DashboardMetric icon={CalendarDays} label="Active rentals" tone="info" value={activeRentals.length.toString()} />
          <DashboardMetric icon={Bell} label="Unread alerts" tone="neutral" value={unreadNotifications.toString()} />
        </div>

        <div className="grid gap-6 xl:grid-cols-[minmax(0,1.25fr)_minmax(360px,0.75fr)]">
          <MotionReveal>
            <Card className="rounded-2xl border-border bg-card p-5 shadow-sm shadow-primary/5 sm:p-6">
              <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.24em] text-primary">Dealer favourites</p>
                  <h2 className="mt-1 text-2xl font-black text-foreground">Quick order</h2>
                  <p className="mt-1 text-sm font-semibold text-muted-foreground">Frequently ordered products, ready for fast reorder.</p>
                </div>
                <Badge className="w-fit rounded-full bg-secondary px-3 py-1 text-secondary-foreground">
                  {quickItems.length} selected
                </Badge>
              </div>

              {isLoading ? (
                <QuickOrderSkeleton />
              ) : quickProducts.length ? (
                <div className="grid gap-4 sm:grid-cols-2 2xl:grid-cols-4">
                  {quickProducts.map((product) => (
                    <QuickOrderCard
                      key={product.id}
                      product={product}
                      quantity={quickCart[product.id] ?? 0}
                      onQuantityChange={updateQuickQuantity}
                    />
                  ))}
                </div>
              ) : (
                <EmptyPanel title="No products yet" description="Products will appear here when the catalog is available." />
              )}

              {quickItems.length > 0 && (
                <div className="mt-5 flex flex-col gap-3 rounded-xl border border-sidebar-border bg-sidebar p-4 text-sidebar-foreground sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm font-bold">{quickItems.length} products selected</p>
                    <p className="font-display mt-1 text-2xl font-black text-sidebar-primary">£{quickTotal.toFixed(2)}</p>
                  </div>
                  <Button
                    asChildShim
                    className="h-11 rounded-md bg-sidebar-primary text-sidebar-primary-foreground hover:bg-sidebar-primary/90"
                  >
                    <Link href={quickCartHref}>
                      <ShoppingCart className="h-4 w-4" />
                      Review cart
                    </Link>
                  </Button>
                </div>
              )}
            </Card>
          </MotionReveal>

          <MotionReveal delay={80} variant="right">
            <Card className="rounded-2xl border-border bg-card p-5 shadow-sm shadow-primary/5 sm:p-6">
              <div className="mb-5 flex items-start justify-between gap-3">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.24em] text-primary">Account feed</p>
                  <h2 className="mt-1 text-2xl font-black text-foreground">Recent activity</h2>
                </div>
                <Sparkles className="h-5 w-5 text-primary" />
              </div>

              {isLoading ? (
                <ActivitySkeleton />
              ) : activities.length ? (
                <div className="grid gap-3">
                  {activities.map((activity) => (
                    <Link
                      className="group rounded-xl border border-border bg-background p-4 transition-colors hover:border-primary/25 hover:bg-secondary/40"
                      href={activity.href}
                      key={activity.id}
                    >
                      <div className="flex items-start gap-3">
                        <ActivityIcon tone={activity.tone} />
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-black text-foreground">{activity.title}</p>
                          <p className="mt-1 line-clamp-2 text-xs font-semibold leading-5 text-muted-foreground">{activity.description}</p>
                          {activity.date ? <p className="mt-2 text-[11px] font-bold text-primary/80">{formatDate(activity.date)}</p> : null}
                        </div>
                        <ArrowRight className="mt-1 h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-primary" />
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <EmptyPanel title="No recent activity" description="Orders, rentals, and notifications will show here." />
              )}
            </Card>
          </MotionReveal>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <MotionReveal variant="left">
            <SummaryPanel
              ctaHref="/orders"
              ctaLabel="Open orders"
              emptyDescription="New orders will appear here after checkout."
              emptyTitle="No orders yet"
              items={openOrders.slice(0, 3).map((order) => ({
                id: order.id,
                title: order.orderNumber,
                description: `${orderStatusLabels[order.status]} · ${paymentStatusLabels[order.paymentStatus]} · £${order.totalAmount.toFixed(2)}`,
                href: `/orderdetails?id=${order.id}`,
              }))}
              title="Open orders"
            />
          </MotionReveal>
          <MotionReveal delay={100} variant="right">
            <SummaryPanel
              ctaHref="/rentals"
              ctaLabel="View rentals"
              emptyDescription="Rental agreements will appear here when created."
              emptyTitle="No active rentals"
              items={activeRentals.slice(0, 3).map((rental) => ({
                id: rental.id,
                title: rental.productName,
                description: `${formatDate(rental.startDate)} - ${formatDate(rental.endDate)} · ${rental.status}`,
                href: "/rentals",
              }))}
              title="Rental snapshot"
            />
          </MotionReveal>
        </div>
      </section>
    </div>
  );
}

function getQuickOrderProducts(products: Product[], orders: Order[]) {
  if (!products.length) return [];

  const counts: Record<string, number> = {};
  for (const order of orders) {
    for (const item of order.items) {
      counts[item.productId] = (counts[item.productId] ?? 0) + item.quantity;
    }
  }

  const ordered = Object.entries(counts)
    .sort(([, a], [, b]) => b - a)
    .map(([productId]) => products.find((product) => product.id === productId))
    .filter((product): product is Product => Boolean(product));

  return (ordered.length ? ordered : products).slice(0, 4);
}

function buildQuickCartHref(cart: Cart) {
  const entries = Object.entries(cart).filter(([, quantity]) => quantity > 0);
  if (!entries.length) return "/products";
  return `/products?cart=${encodeURIComponent(JSON.stringify(entries))}`;
}

function getRecentActivities(orders: Order[], rentals: Rental[], notifications: Notification[]): ActivityItem[] {
  const orderActivities: ActivityItem[] = orders.slice(0, 4).map((order) => ({
    id: `order-${order.id}`,
    title: `Order ${order.orderNumber}`,
    description: `${orderStatusLabels[order.status]} · ${paymentStatusLabels[order.paymentStatus]} · £${order.totalAmount.toFixed(2)}`,
    href: `/orderdetails?id=${order.id}`,
    date: order.updatedAt || order.createdAt,
    tone: "order",
  }));

  const rentalActivities: ActivityItem[] = rentals.slice(0, 3).map((rental) => ({
    id: `rental-${rental.id}`,
    title: rental.productName,
    description: `${rental.status} rental · ${formatDate(rental.startDate)} - ${formatDate(rental.endDate)}`,
    href: "/rentals",
    date: rental.updatedAt || rental.createdAt || rental.startDate,
    tone: "rental",
  }));

  const notificationActivities: ActivityItem[] = notifications.slice(0, 4).map((notification) => ({
    id: `notification-${notification.id}`,
    title: notification.title,
    description: notification.message,
    href: "/notifications",
    date: notification.updatedAt || notification.createdAt,
    tone: "notification",
  }));

  return [...orderActivities, ...rentalActivities, ...notificationActivities]
    .sort((a, b) => Date.parse(b.date ?? "") - Date.parse(a.date ?? ""))
    .slice(0, 6);
}

function DashboardMetric({
  icon: Icon,
  label,
  tone,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  tone: "primary" | "warning" | "info" | "neutral";
  value: string;
}) {
  const toneClass = {
    primary: "bg-chart-1/10 text-chart-1",
    warning: "bg-chart-3/10 text-chart-3",
    info: "bg-chart-4/10 text-chart-4",
    neutral: "bg-primary/10 text-primary",
  }[tone];

  return (
    <Card className="rounded-2xl border-border bg-card p-5 shadow-sm shadow-primary/5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[11px] font-black uppercase tracking-[0.18em] text-muted-foreground">{label}</p>
          <p className="font-display mt-4 text-4xl font-black text-foreground">{value}</p>
        </div>
        <div className={`grid h-12 w-12 place-items-center rounded-full ${toneClass}`}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </Card>
  );
}

function QuickOrderCard({
  onQuantityChange,
  product,
  quantity,
}: {
  onQuantityChange: (productId: string, quantity: number) => void;
  product: Product;
  quantity: number;
}) {
  return (
    <Card className="flex h-full flex-col overflow-hidden rounded-xl border-border bg-background p-2 shadow-none">
      <div className="overflow-hidden rounded-lg bg-secondary">
        {product.imageUrl ? (
          <img alt={product.name} className="aspect-[4/3] w-full object-cover" src={product.imageUrl} />
        ) : (
          <div className="grid aspect-[4/3] w-full place-items-center text-primary">
            <Coffee className="h-9 w-9" />
          </div>
        )}
      </div>
      <div className="flex flex-1 flex-col p-3">
        <div className="min-h-[70px]">
          <h3 className="line-clamp-2 text-sm font-black leading-5 text-foreground">{product.name}</h3>
          <p className="mt-1 text-xs font-semibold text-muted-foreground">
            {product.category}
            {product.weight ? ` · ${product.weight}` : ""}
          </p>
        </div>
        <div className="mt-auto space-y-3 pt-3">
          <strong className="font-display block whitespace-nowrap text-xl font-black text-primary">£{product.price.toFixed(2)}</strong>
          <div className="grid h-9 grid-cols-[2.25rem_1fr_2.25rem] overflow-hidden rounded-md border border-border bg-card">
            <button
              aria-label={`Decrease ${product.name}`}
              className="grid h-9 w-9 place-items-center text-muted-foreground transition-colors hover:text-primary"
              onClick={() => onQuantityChange(product.id, Math.max(0, quantity - 1))}
              type="button"
            >
              -
            </button>
            <span className="grid h-9 min-w-0 place-items-center text-sm font-black text-foreground">{quantity}</span>
            <button
              aria-label={`Increase ${product.name}`}
              className="grid h-9 w-9 place-items-center text-primary transition-colors hover:bg-secondary"
              onClick={() => onQuantityChange(product.id, quantity + 1)}
              type="button"
            >
              <Plus className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>
    </Card>
  );
}

function SummaryPanel({
  ctaHref,
  ctaLabel,
  emptyDescription,
  emptyTitle,
  items,
  title,
}: {
  ctaHref: string;
  ctaLabel: string;
  emptyDescription: string;
  emptyTitle: string;
  items: Array<{ id: string; title: string; description: string; href: string }>;
  title: string;
}) {
  return (
    <Card className="rounded-2xl border-border bg-card p-5 shadow-sm shadow-primary/5 sm:p-6">
      <div className="mb-5 flex items-center justify-between gap-3">
        <h2 className="text-2xl font-black text-foreground">{title}</h2>
        <Button asChildShim className="h-9 rounded-md" variant="outline">
          <Link href={ctaHref}>{ctaLabel}</Link>
        </Button>
      </div>
      {items.length ? (
        <div className="grid gap-3">
          {items.map((item) => (
            <Link className="rounded-xl border border-border bg-background p-4 transition-colors hover:border-primary/25 hover:bg-secondary/40" href={item.href} key={item.id}>
              <p className="text-sm font-black text-foreground">{item.title}</p>
              <p className="mt-1 text-xs font-semibold text-muted-foreground">{item.description}</p>
            </Link>
          ))}
        </div>
      ) : (
        <EmptyPanel title={emptyTitle} description={emptyDescription} />
      )}
    </Card>
  );
}

function ActivityIcon({ tone }: { tone: ActivityItem["tone"] }) {
  const Icon = tone === "order" ? ShoppingCart : tone === "rental" ? CalendarDays : Bell;
  const className = tone === "order" ? "bg-chart-1/10 text-chart-1" : tone === "rental" ? "bg-chart-4/10 text-chart-4" : "bg-primary/10 text-primary";
  return (
    <span className={`grid h-9 w-9 flex-shrink-0 place-items-center rounded-full ${className}`}>
      <Icon className="h-4 w-4" />
    </span>
  );
}

function EmptyPanel({ description, title }: { description: string; title: string }) {
  return (
    <div className="rounded-xl border border-dashed border-border bg-background p-6 text-center">
      <CheckCircle2 className="mx-auto h-8 w-8 text-muted-foreground/45" />
      <p className="mt-3 text-sm font-black text-foreground">{title}</p>
      <p className="mt-1 text-xs font-semibold leading-5 text-muted-foreground">{description}</p>
    </div>
  );
}

function QuickOrderSkeleton() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {Array.from({ length: 4 }).map((_, index) => (
        <div className="rounded-xl border border-border bg-background p-2" key={index}>
          <div className="aspect-[4/3] animate-pulse rounded-lg bg-secondary" />
          <div className="p-3">
            <div className="h-4 w-4/5 animate-pulse rounded bg-secondary" />
            <div className="mt-2 h-3 w-2/3 animate-pulse rounded bg-secondary" />
            <div className="mt-5 h-8 animate-pulse rounded bg-secondary" />
          </div>
        </div>
      ))}
    </div>
  );
}

function ActivitySkeleton() {
  return (
    <div className="grid gap-3">
      {Array.from({ length: 4 }).map((_, index) => (
        <div className="rounded-xl border border-border bg-background p-4" key={index}>
          <div className="h-4 w-2/3 animate-pulse rounded bg-secondary" />
          <div className="mt-3 h-3 w-full animate-pulse rounded bg-secondary" />
          <div className="mt-2 h-3 w-1/2 animate-pulse rounded bg-secondary" />
        </div>
      ))}
    </div>
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

function formatDate(value: string) {
  if (!value) return "No date";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("en-GB", { day: "2-digit", month: "short" }).format(date);
}
